/**
 * Travelpayouts / Hotellook API Configuration
 *
 * Token:  Dashboard → API → copy API Token
 * Marker: Dashboard → Affiliate Tools → copy your Marker (affiliate ID)
 */
export const TP_CONFIG = {
  token:          process.env.TRAVELPAYOUTS_TOKEN  || '',
  marker:         process.env.TRAVELPAYOUTS_MARKER || '',
  cacheUrl:       'https://engine.hotellook.com/api/v2/cache.json',
  autocompleteUrl:'https://autocomplete.travelpayouts.com/places2',
  photoBase:      'https://photo.hotellook.com/image_v2/limit',
  bookBase:       'https://search.hotellook.com',
};
