const IMAGE_BY_KEY = {
  LHE: '/images/destination/destination6.jpg',
  Lahore: '/images/destination/destination6.jpg',
  DXB: '/images/destination/destination4.jpg',
  Dubai: '/images/destination/destination4.jpg',
  BKK: '/images/destination/destination5.jpg',
  Bangkok: '/images/destination/destination5.jpg',
  LHR: '/images/destination/destination9.jpg',
  London: '/images/destination/destination9.jpg',
  CDG: '/images/destination/destination7.jpg',
  Paris: '/images/destination/destination7.jpg',
  JFK: '/images/destination/destination3.jpg',
  'New York': '/images/destination/destination3.jpg',
  NRT: '/images/destination/destination11.jpg',
  Tokyo: '/images/destination/destination11.jpg',
  SIN: '/images/destination/destination12.jpg',
  Singapore: '/images/destination/destination12.jpg',
  IST: '/images/destination/destination8.jpg',
  Istanbul: '/images/destination/destination8.jpg',
  FCO: '/images/destination/destination7.jpg',
  Rome: '/images/destination/destination7.jpg',
  BCN: '/images/destination/destination5.jpg',
  Barcelona: '/images/destination/destination5.jpg',
  SYD: '/images/destination/destination2.jpg',
  Sydney: '/images/destination/destination2.jpg',
  AMS: '/images/destination/destination13.jpg',
  Amsterdam: '/images/destination/destination13.jpg',
  CAI: '/images/destination/destination7.jpg',
  Cairo: '/images/destination/destination7.jpg',
  GRU: '/images/destination/destination14.jpg',
  'São Paulo': '/images/destination/destination14.jpg',
  CPT: '/images/destination/destination15.jpg',
  'Cape Town': '/images/destination/destination15.jpg',
  KHI: '/images/destination/destination16.jpg',
  Karachi: '/images/destination/destination16.jpg',
  Quetta: '/images/destination/destination1.jpg',
  Tashkent: '/images/destination/destination8.jpg',
  Multan: '/images/destination/destination6.jpg',
  Skardu: '/images/destination/destination1.jpg',
  KDU: '/images/destination/destination1.jpg',
  MOW: '/images/destination/destination13.jpg',
  Moscow: '/images/destination/destination13.jpg',
  JED: '/images/destination/destination4.jpg',
  Jeddah: '/images/destination/destination4.jpg',
  DOH: '/images/destination/destination4.jpg',
  Doha: '/images/destination/destination4.jpg',
  BAH: '/images/destination/destination12.jpg',
  Bahrain: '/images/destination/destination12.jpg',
  KUL: '/images/destination/destination12.jpg',
  'Kuala Lumpur': '/images/destination/destination12.jpg',
  MLE: '/images/destination/destination4.jpg',
  Maldives: '/images/destination/destination4.jpg',
  ICN: '/images/destination/destination11.jpg',
  Seoul: '/images/destination/destination11.jpg',
  ATH: '/images/destination/destination7.jpg',
  Athens: '/images/destination/destination7.jpg',
  Riyadh: '/images/destination/destination4.jpg',
  Almaty: '/images/destination/destination1.jpg',
  Baku: '/images/destination/destination9.jpg',
};

const IMAGE_POOL = [
  '/images/destination/destination1.jpg',
  '/images/destination/destination2.jpg',
  '/images/destination/destination3.jpg',
  '/images/destination/destination4.jpg',
  '/images/destination/destination5.jpg',
  '/images/destination/destination6.jpg',
  '/images/destination/destination7.jpg',
  '/images/destination/destination8.jpg',
  '/images/destination/destination9.jpg',
  '/images/destination/destination10.jpg',
  '/images/destination/destination11.jpg',
  '/images/destination/destination12.jpg',
  '/images/destination/destination13.jpg',
  '/images/destination/destination14.jpg',
  '/images/destination/destination15.jpg',
  '/images/destination/destination16.jpg',
  '/images/destination/destination17.jpg',
];

const DEFAULT_PHOTO = '/images/destination/destination13.jpg';

const hashKey = (value) => {
  let hash = 0;
  const text = String(value || '');

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getExploreDestinationImageId = ({ iata, city, country }) => {
  const direct = IMAGE_BY_KEY[iata] || IMAGE_BY_KEY[city] || IMAGE_BY_KEY[country];
  if (direct) return direct;

  const key = [iata, city, country].filter(Boolean).join('|');
  const index = hashKey(key) % IMAGE_POOL.length;
  return IMAGE_POOL[index] || DEFAULT_PHOTO;
};
