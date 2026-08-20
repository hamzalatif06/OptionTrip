import UserMemoryProfile from '../models/UserMemoryProfile.js';
import { getOrCreateProfile } from '../services/memoryProfileService.js';

const EDITABLE_LIST_FIELDS = [
  'favorite_destinations', 'avoided_or_disliked', 'trip_types',
  'interests', 'dietary', 'notable_quotes'
];

export const getMemory = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    res.json({
      success: true,
      data: { summary: profile.summary, facts: profile.facts, updatedAt: profile.updatedAt }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMemoryFact = async (req, res) => {
  try {
    const { facts } = req.body;
    if (!facts || typeof facts !== 'object') {
      return res.status(400).json({ success: false, message: 'facts object is required' });
    }

    const update = {};
    if (typeof facts.home_base === 'string' || facts.home_base === null) {
      update['facts.home_base'] = facts.home_base || null;
    }
    if (typeof facts.typical_budget === 'string' || facts.typical_budget === null) {
      update['facts.typical_budget'] = facts.typical_budget || null;
    }
    for (const field of EDITABLE_LIST_FIELDS) {
      if (Array.isArray(facts[field])) {
        update[`facts.${field}`] = facts[field].filter((v) => typeof v === 'string');
      }
    }

    const profile = await UserMemoryProfile.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: { facts: profile.facts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const forgetMemory = async (req, res) => {
  try {
    await UserMemoryProfile.findOneAndUpdate(
      { user_id: req.user._id },
      {
        $set: {
          summary: '',
          facts: {
            home_base: null, favorite_destinations: [], avoided_or_disliked: [],
            trip_types: [], typical_budget: null, typical_party_size: null,
            interests: [], dietary: [], notable_quotes: [],
            upsell_suggested_at: { esim: null, car: null, hotel: null, tours: null }
          }
        }
      },
      { upsert: true }
    );
    res.json({ success: true, message: 'Memory cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default { getMemory, updateMemoryFact, forgetMemory };
