import TripStoryEntry from '../models/TripStoryEntry.js';
import { fetchMediaPreview, geocodePlace, refineText } from '../services/tripStoryService.js';
import { checkAndUnlockAchievements } from '../services/achievementService.js';

export const createEntry = async (req, res) => {
  try {
    const { trip_id, location, text, mediaLinks, sourceType } = req.body;
    if (!location?.name) return res.status(400).json({ success: false, message: 'A location name is required' });
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const resolvedLocation = { ...location };
    if (typeof resolvedLocation.coordinates?.lat !== 'number') {
      const query = [location.name, location.city, location.country].filter(Boolean).join(', ');
      const coords = await geocodePlace(query);
      if (coords) resolvedLocation.coordinates = coords;
    }

    const resolvedMedia = [];
    for (const link of (mediaLinks || []).slice(0, 3)) {
      if (!link?.url) continue;
      const preview = await fetchMediaPreview(link.url);
      resolvedMedia.push({ url: link.url, ...preview });
    }

    const entry = await TripStoryEntry.create({
      user_id: req.user._id,
      trip_id: trip_id || null,
      location: resolvedLocation,
      text: text.trim(),
      mediaLinks: resolvedMedia,
      sourceType: sourceType === 'voice' ? 'voice' : 'text'
    });

    checkAndUnlockAchievements(req.user._id).catch(() => {});
    res.status(201).json({ success: true, data: { entry } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listMyEntries = async (req, res) => {
  try {
    const entries = await TripStoryEntry.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { entries } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listEntriesForTrip = async (req, res) => {
  try {
    const entries = await TripStoryEntry.find({ trip_id: req.params.tripId, user_id: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { entries } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listPublicEntriesNear = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.json({ success: true, data: { entries: [] } });
    const entries = await TripStoryEntry.find({ 'location.city': new RegExp(`^${city}$`, 'i'), isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user_id', 'name');
    res.json({ success: true, data: { entries } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const result = await TripStoryEntry.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!result) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const refineEntryText = async (req, res) => {
  try {
    const { text, mode } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
    const refined = await refineText(text, mode === 'improve_style' ? 'improve_style' : 'fix_grammar');
    res.json({ success: true, data: { text: refined } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const previewMediaLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'url is required' });
    const preview = await fetchMediaPreview(url);
    res.json({ success: true, data: preview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default { createEntry, listMyEntries, listEntriesForTrip, listPublicEntriesNear, deleteEntry, refineEntryText, previewMediaLink };
