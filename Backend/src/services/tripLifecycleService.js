import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import VisitedLocation from '../models/VisitedLocation.js';
import { checkAndUnlockAchievements } from './achievementService.js';

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

const autoPopulateVisitedLocations = async (trip) => {
  const alreadyDone = await VisitedLocation.exists({ trip_id: trip.trip_id, user_id: trip.user_id });
  if (alreadyDone) return 0;

  const visitedAt = trip.dates?.end_date ? new Date(trip.dates.end_date) : new Date();
  const entries = [];

  const destName = trip.destination?.name || trip.destination?.text;
  if (destName) {
    entries.push({
      user_id: trip.user_id,
      trip_id: trip.trip_id,
      name: destName,
      coordinates: trip.destination?.geometry || undefined,
      category: 'destination',
      visited_at: visitedAt
    });
  }

  const selectedOption = trip.options?.find(o => o.option_id === trip.selected_option_id) || trip.options?.[0];
  for (const day of selectedOption?.itinerary || []) {
    for (const act of day.activities || []) {
      if (!act.place_name) continue;
      entries.push({
        user_id: trip.user_id,
        trip_id: trip.trip_id,
        name: act.place_name,
        coordinates: act.location?.coordinates,
        category: act.category || 'sightseeing',
        visited_at: visitedAt,
        image: act.image
      });
    }
  }

  if (!entries.length) return 0;
  await VisitedLocation.insertMany(entries);
  if (mongoose.Types.ObjectId.isValid(trip.user_id)) {
    checkAndUnlockAchievements(trip.user_id).catch(() => {});
  }
  return entries.length;
};

export const updateTripTravelStatuses = async () => {
  const today = todayDateOnly();

  const toActivate = await Trip.updateMany(
    {
      deleted: { $ne: true },
      travel_status: 'planned',
      'dates.start_date': { $lte: today }
    },
    { $set: { travel_status: 'active' } }
  );
  const activated = toActivate.modifiedCount || 0;

  const tripsToComplete = await Trip.find({
    deleted: { $ne: true },
    travel_status: 'active',
    'dates.end_date': { $lt: today }
  });

  let visitedLocationsCreated = 0;
  for (const trip of tripsToComplete) {
    try {
      visitedLocationsCreated += await autoPopulateVisitedLocations(trip);
    } catch (err) {
      console.error(`autoPopulateVisitedLocations failed for trip ${trip.trip_id}:`, err.message);
    }
  }

  if (tripsToComplete.length) {
    await Trip.updateMany(
      { trip_id: { $in: tripsToComplete.map(t => t.trip_id) } },
      { $set: { travel_status: 'completed' } }
    );
  }
  const completed = tripsToComplete.length;

  return { activated, completed, visitedLocationsCreated };
};

export const startTripNow = async (tripId, userId) => {
  const trip = await Trip.findOne({ trip_id: tripId });
  if (!trip) return { error: 'not_found' };
  if (trip.user_id && userId && trip.user_id !== userId) return { error: 'forbidden' };
  if (trip.travel_status === 'active') return { trip };

  trip.travel_status = 'active';
  await trip.save();
  return { trip };
};

export default { updateTripTravelStatuses, startTripNow };
