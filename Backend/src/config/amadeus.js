/**
 * Amadeus Travel API Configuration
 * Sign up and get credentials at: https://developers.amadeus.com
 * Use test.api.amadeus.com for sandbox; api.amadeus.com for production.
 */

export const AMADEUS_CONFIG = {
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com',
};
