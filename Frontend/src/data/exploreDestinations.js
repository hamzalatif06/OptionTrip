export const EXPLORE_DESTINATIONS = [
  { iata: 'DXB', city: 'Dubai',         country: 'UAE',          photo: '/images/destination/destination4.jpg' },
  { iata: 'BKK', city: 'Bangkok',        country: 'Thailand',     photo: '/images/destination/destination5.jpg' },
  { iata: 'LHR', city: 'London',         country: 'UK',           photo: '/images/destination/destination9.jpg' },
  { iata: 'CDG', city: 'Paris',          country: 'France',       photo: '/images/destination/destination7.jpg' },
  { iata: 'JFK', city: 'New York',       country: 'USA',          photo: '/images/destination/destination3.jpg' },
  { iata: 'NRT', city: 'Tokyo',          country: 'Japan',        photo: '/images/destination/destination11.jpg' },
  { iata: 'SIN', city: 'Singapore',      country: 'Singapore',    photo: '/images/destination/destination12.jpg' },
  { iata: 'IST', city: 'Istanbul',       country: 'Turkey',       photo: '/images/destination/destination8.jpg' },
  { iata: 'FCO', city: 'Rome',           country: 'Italy',        photo: '/images/destination/destination7.jpg' },
  { iata: 'BCN', city: 'Barcelona',      country: 'Spain',        photo: '/images/destination/destination5.jpg' },
  { iata: 'SYD', city: 'Sydney',         country: 'Australia',    photo: '/images/destination/destination2.jpg' },
  { iata: 'DPS', city: 'Bali',           country: 'Indonesia',    photo: '/images/destination/destination5.jpg' },
  { iata: 'KUL', city: 'Kuala Lumpur',   country: 'Malaysia',     photo: '/images/destination/destination12.jpg' },
  { iata: 'MLE', city: 'Maldives',       country: 'Maldives',     photo: '/images/destination/destination4.jpg' },
  { iata: 'ICN', city: 'Seoul',          country: 'South Korea',  photo: '/images/destination/destination11.jpg' },
  { iata: 'ATH', city: 'Athens',         country: 'Greece',       photo: '/images/destination/destination7.jpg' },
  { iata: 'AMS', city: 'Amsterdam',      country: 'Netherlands',  photo: '/images/destination/destination13.jpg' },
  { iata: 'CAI', city: 'Cairo',          country: 'Egypt',        photo: '/images/destination/destination7.jpg' },
  { iata: 'GRU', city: 'São Paulo',      country: 'Brazil',       photo: '/images/destination/destination14.jpg' },
  { iata: 'CPT', city: 'Cape Town',      country: 'South Africa', photo: '/images/destination/destination15.jpg' },
];

export const getExploreImageUrl = (photo) => {
  if (!photo) return '/images/destination/destination13.jpg';
  if (photo.startsWith('/')) return photo;
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&q=75`;
};
