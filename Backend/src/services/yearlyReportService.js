import Trip from '../models/Trip.js';
import VisitedLocation from '../models/VisitedLocation.js';
import TripStoryEntry from '../models/TripStoryEntry.js';

const dayCount = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 0;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
};

export const buildYearlyReport = async (userId, year) => {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const userIdStr = userId.toString();

  const [trips, locations, tripStoryCount] = await Promise.all([
    Trip.find({
      user_id: userIdStr,
      deleted: { $ne: true },
      'dates.start_date': { $gte: yearStart, $lte: yearEnd }
    }).select('destination dates').lean(),
    VisitedLocation.find({
      user_id: userId,
      visited_at: { $gte: new Date(yearStart), $lte: new Date(`${year}-12-31T23:59:59Z`) }
    }).select('country city name').lean(),
    TripStoryEntry.countDocuments({
      user_id: userId,
      createdAt: { $gte: new Date(yearStart), $lte: new Date(`${year}-12-31T23:59:59Z`) }
    })
  ]);

  const countries = [...new Set(locations.map(l => l.country).filter(Boolean))];
  const cities = [...new Set(locations.map(l => l.city || l.name).filter(Boolean))];

  const countryFrequency = {};
  for (const l of locations) {
    if (!l.country) continue;
    countryFrequency[l.country] = (countryFrequency[l.country] || 0) + 1;
  }
  const mostVisitedCountry = Object.entries(countryFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  let longestTrip = null;
  let favoriteDestination = null;
  let maxDays = 0;
  for (const trip of trips) {
    const days = trip.dates?.duration_days || dayCount(trip.dates?.start_date, trip.dates?.end_date);
    if (days > maxDays) {
      maxDays = days;
      longestTrip = { destination: trip.destination?.name || trip.destination?.text, days };
    }
  }
  favoriteDestination = trips[0]?.destination?.name || trips[0]?.destination?.text || null;

  return {
    year,
    countriesVisited: countries.length,
    citiesVisited: cities.length,
    routesTraveled: trips.length,
    tripStoriesCreated: tripStoryCount,
    mostVisitedCountry,
    longestTrip,
    favoriteDestination,
    countries,
    hasActivity: trips.length > 0 || locations.length > 0
  };
};

export default { buildYearlyReport };
