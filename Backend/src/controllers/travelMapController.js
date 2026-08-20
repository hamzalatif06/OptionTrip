import crypto from 'crypto';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import VisitedLocation from '../models/VisitedLocation.js';
import { buildTravelStatsCard } from '../services/shareCardService.js';
import { getUserStats, computeTravelLevel } from '../services/achievementService.js';

const computeMapStats = async (user) => {
  const locations = await VisitedLocation.find({ user_id: user._id }).sort({ visited_at: -1 }).lean();
  const tripsCount = await Trip.countDocuments({ user_id: user._id.toString(), deleted: { $ne: true } });
  const countries = [...new Set(locations.map(l => l.country).filter(Boolean))];
  const cities = [...new Set(locations.map(l => l.city || l.name).filter(Boolean))];
  return { locations, countries, cities, tripsCount };
};

export const shareTravelMap = async (req, res) => {
  try {
    const user = req.user;
    const token = user.mapShareToken || crypto.randomBytes(16).toString('hex');
    if (!user.mapShareToken) {
      user.mapShareToken = token;
      await user.save();
    }
    const shareUrl = `${process.env.VITE_SITE_URL || 'https://optiontrip.com'}/shared-map/${token}`;
    return res.json({ success: true, data: { mapShareToken: token, shareUrl, mapPrivacy: user.mapPrivacy } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicTravelMap = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ mapShareToken: token }).select('name mapPrivacy mapShareToken');
    if (!user || user.mapPrivacy === 'private') {
      return res.status(404).json({ success: false, message: 'This travel map is not available' });
    }

    const { locations, countries, cities, tripsCount } = await computeMapStats(user);
    const level = computeTravelLevel(await getUserStats(user._id));

    const base = {
      name: user.name,
      countriesVisited: countries.length,
      citiesVisited: cities.length,
      tripsCreated: tripsCount,
      mapPrivacy: user.mapPrivacy,
      level
    };

    if (user.mapPrivacy === 'countries_only') {
      return res.json({ success: true, data: { ...base, countries } });
    }

    return res.json({
      success: true,
      data: {
        ...base,
        countries,
        locations: locations.map(l => ({
          name: l.name, city: l.city, country: l.country,
          coordinates: l.coordinates, category: l.category, visited_at: l.visited_at
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTravelMapShareCard = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ mapShareToken: token }).select('name mapPrivacy mapShareToken');
    if (!user || user.mapPrivacy === 'private') {
      return res.status(404).json({ success: false, message: 'This travel map is not available' });
    }

    const { countries, cities, tripsCount } = await computeMapStats(user);
    const svg = buildTravelStatsCard({
      name: user.name,
      countriesVisited: countries.length,
      citiesVisited: cities.length,
      tripsCreated: tripsCount
    });

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(svg);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default { shareTravelMap, getPublicTravelMap, getTravelMapShareCard };
