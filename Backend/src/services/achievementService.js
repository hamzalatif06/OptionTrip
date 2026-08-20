import User from '../models/User.js';
import Trip from '../models/Trip.js';
import VisitedLocation from '../models/VisitedLocation.js';
import TripStoryEntry from '../models/TripStoryEntry.js';

export const ACHIEVEMENTS = [
  { id: 'first_trip',       label: 'First Trip Added',       icon: '🧳', check: (s) => s.tripsCreated >= 1 },
  { id: 'five_countries',   label: '5 Countries Visited',    icon: '🌍', check: (s) => s.countries >= 5 },
  { id: 'ten_cities',       label: '10 Cities Explored',     icon: '🏙️', check: (s) => s.cities >= 10 },
  { id: 'first_tripstory',  label: 'First TripStory Created', icon: '📍', check: (s) => s.tripStoryEntries >= 1 },
  { id: 'ten_tips',         label: '10 Travel Tips Shared',   icon: '💬', check: (s) => s.tripStoryEntries >= 10 },
];

export const LEVELS = [
  { id: 'explorer',        label: 'Explorer',        minScore: 0 },
  { id: 'traveler',        label: 'Traveler',        minScore: 5 },
  { id: 'adventurer',      label: 'Adventurer',      minScore: 15 },
  { id: 'pathfinder',      label: 'Pathfinder',      minScore: 30 },
  { id: 'global_traveler', label: 'Global Traveler', minScore: 50 },
];

export const getUserStats = async (userId) => {
  const userIdStr = userId.toString();
  const [tripsCreated, locations, tripStoryEntries] = await Promise.all([
    Trip.countDocuments({ user_id: userIdStr, deleted: { $ne: true } }),
    VisitedLocation.find({ user_id: userId }).select('country city name').lean(),
    TripStoryEntry.countDocuments({ user_id: userId })
  ]);
  const countries = new Set(locations.map(l => l.country).filter(Boolean)).size;
  const cities = new Set(locations.map(l => l.city || l.name).filter(Boolean)).size;
  return { tripsCreated, countries, cities, tripStoryEntries };
};

export const computeTravelLevel = (stats) => {
  const score = stats.tripsCreated + stats.countries * 2 + stats.cities + stats.tripStoryEntries;
  let current = LEVELS[0];
  let next = LEVELS[1] || null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (score >= LEVELS[i].minScore) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  return {
    id: current.id,
    label: current.label,
    score,
    next: next ? { id: next.id, label: next.label, pointsNeeded: next.minScore - score } : null
  };
};

export const checkAndUnlockAchievements = async (userId) => {
  try {
    const user = await User.findById(userId).select('achievements');
    if (!user) return [];
    const stats = await getUserStats(userId);
    const alreadyUnlocked = new Set((user.achievements || []).map(a => a.id));
    const newlyUnlocked = ACHIEVEMENTS.filter(a => !alreadyUnlocked.has(a.id) && a.check(stats));

    if (newlyUnlocked.length) {
      user.achievements.push(...newlyUnlocked.map(a => ({ id: a.id, unlockedAt: new Date() })));
      await user.save();
    }
    return newlyUnlocked;
  } catch (err) {
    console.error('checkAndUnlockAchievements failed:', err.message);
    return [];
  }
};

export default { ACHIEVEMENTS, LEVELS, getUserStats, computeTravelLevel, checkAndUnlockAchievements };
