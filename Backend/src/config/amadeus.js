export const AMADEUS_CONFIG = {
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com',
};
