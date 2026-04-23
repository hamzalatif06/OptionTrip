/**
 * Flight Controller
 * Handles flight search requests via Amadeus API.
 */

import { searchFlights as amadeusSearchFlights } from '../services/amadeusService.js';
import { searchFlights as tpSearchFlights, getCheapPrice, getExploreDestinations } from '../services/travelpayoutsFlightService.js';
import { searchFlightsGoogle } from '../services/googleFlightsService.js';
import { searchFlightsDuffel } from '../services/duffelService.js';
import { searchDestinationImage } from '../services/unsplashService.js';
import {
  getPlaceImageWithCache,
  getPlaceImagesForMultiplePlaces,
  getCacheStats
} from '../services/googlePlacesService.js';
import PlaceImage from '../models/PlaceImage.js';

// ── Country → top airports mapping ───────────────────────────────────────────
// Used when user types a country name instead of a city (e.g. "Pakistan", "India").
// Keys must be lowercase; values are ordered by traffic/popularity.
const COUNTRY_AIRPORTS = {
  'pakistan':             [
    { iataCode: 'KHI', cityName: 'Karachi',    name: 'Jinnah International Airport',                countryName: 'Pakistan' },
    { iataCode: 'LHE', cityName: 'Lahore',     name: 'Allama Iqbal International Airport',          countryName: 'Pakistan' },
    { iataCode: 'ISB', cityName: 'Islamabad',  name: 'Islamabad International Airport',             countryName: 'Pakistan' },
    { iataCode: 'PEW', cityName: 'Peshawar',   name: 'Bacha Khan International Airport',            countryName: 'Pakistan' },
    { iataCode: 'SKT', cityName: 'Sialkot',    name: 'Sialkot International Airport',               countryName: 'Pakistan' },
    { iataCode: 'UET', cityName: 'Quetta',     name: 'Quetta International Airport',                countryName: 'Pakistan' },
  ],
  'india':                [
    { iataCode: 'DEL', cityName: 'New Delhi',  name: 'Indira Gandhi International Airport',         countryName: 'India' },
    { iataCode: 'BOM', cityName: 'Mumbai',     name: 'Chhatrapati Shivaji Maharaj Int\'l Airport',  countryName: 'India' },
    { iataCode: 'BLR', cityName: 'Bangalore',  name: 'Kempegowda International Airport',            countryName: 'India' },
    { iataCode: 'MAA', cityName: 'Chennai',    name: 'Chennai International Airport',               countryName: 'India' },
    { iataCode: 'HYD', cityName: 'Hyderabad',  name: 'Rajiv Gandhi International Airport',          countryName: 'India' },
    { iataCode: 'CCU', cityName: 'Kolkata',    name: 'Netaji Subhas Chandra Bose Int\'l Airport',   countryName: 'India' },
    { iataCode: 'COK', cityName: 'Kochi',      name: 'Cochin International Airport',                countryName: 'India' },
    { iataCode: 'AMD', cityName: 'Ahmedabad',  name: 'Sardar Vallabhbhai Patel Int\'l Airport',     countryName: 'India' },
  ],
  'bangladesh':           [
    { iataCode: 'DAC', cityName: 'Dhaka',      name: 'Hazrat Shahjalal International Airport',      countryName: 'Bangladesh' },
    { iataCode: 'CGP', cityName: 'Chittagong', name: 'Shah Amanat International Airport',           countryName: 'Bangladesh' },
    { iataCode: 'ZYL', cityName: 'Sylhet',     name: 'Osmani International Airport',                countryName: 'Bangladesh' },
  ],
  'united arab emirates': [
    { iataCode: 'DXB', cityName: 'Dubai',        name: 'Dubai International Airport',               countryName: 'United Arab Emirates' },
    { iataCode: 'AUH', cityName: 'Abu Dhabi',    name: 'Abu Dhabi International Airport',           countryName: 'United Arab Emirates' },
    { iataCode: 'SHJ', cityName: 'Sharjah',      name: 'Sharjah International Airport',             countryName: 'United Arab Emirates' },
  ],
  'uae':                  [
    { iataCode: 'DXB', cityName: 'Dubai',        name: 'Dubai International Airport',               countryName: 'United Arab Emirates' },
    { iataCode: 'AUH', cityName: 'Abu Dhabi',    name: 'Abu Dhabi International Airport',           countryName: 'United Arab Emirates' },
    { iataCode: 'SHJ', cityName: 'Sharjah',      name: 'Sharjah International Airport',             countryName: 'United Arab Emirates' },
  ],
  'saudi arabia':         [
    { iataCode: 'JED', cityName: 'Jeddah',       name: 'King Abdulaziz International Airport',      countryName: 'Saudi Arabia' },
    { iataCode: 'RUH', cityName: 'Riyadh',       name: 'King Khalid International Airport',         countryName: 'Saudi Arabia' },
    { iataCode: 'MED', cityName: 'Medina',        name: 'Prince Mohammad Bin Abdulaziz Airport',    countryName: 'Saudi Arabia' },
    { iataCode: 'DMM', cityName: 'Dammam',        name: 'King Fahd International Airport',          countryName: 'Saudi Arabia' },
  ],
  'united kingdom':       [
    { iataCode: 'LHR', cityName: 'London',       name: 'Heathrow Airport',                          countryName: 'United Kingdom' },
    { iataCode: 'LGW', cityName: 'London',       name: 'Gatwick Airport',                           countryName: 'United Kingdom' },
    { iataCode: 'MAN', cityName: 'Manchester',   name: 'Manchester Airport',                        countryName: 'United Kingdom' },
    { iataCode: 'EDI', cityName: 'Edinburgh',    name: 'Edinburgh Airport',                         countryName: 'United Kingdom' },
    { iataCode: 'BHX', cityName: 'Birmingham',   name: 'Birmingham Airport',                        countryName: 'United Kingdom' },
  ],
  'uk':                   [
    { iataCode: 'LHR', cityName: 'London',       name: 'Heathrow Airport',                          countryName: 'United Kingdom' },
    { iataCode: 'LGW', cityName: 'London',       name: 'Gatwick Airport',                           countryName: 'United Kingdom' },
    { iataCode: 'MAN', cityName: 'Manchester',   name: 'Manchester Airport',                        countryName: 'United Kingdom' },
  ],
  'england':              [
    { iataCode: 'LHR', cityName: 'London',       name: 'Heathrow Airport',                          countryName: 'United Kingdom' },
    { iataCode: 'LGW', cityName: 'London',       name: 'Gatwick Airport',                           countryName: 'United Kingdom' },
    { iataCode: 'MAN', cityName: 'Manchester',   name: 'Manchester Airport',                        countryName: 'United Kingdom' },
  ],
  'united states':        [
    { iataCode: 'JFK', cityName: 'New York',     name: 'John F. Kennedy International Airport',     countryName: 'United States' },
    { iataCode: 'LAX', cityName: 'Los Angeles',  name: 'Los Angeles International Airport',         countryName: 'United States' },
    { iataCode: 'ORD', cityName: 'Chicago',      name: 'O\'Hare International Airport',             countryName: 'United States' },
    { iataCode: 'DFW', cityName: 'Dallas',       name: 'Dallas/Fort Worth International Airport',   countryName: 'United States' },
    { iataCode: 'MIA', cityName: 'Miami',        name: 'Miami International Airport',               countryName: 'United States' },
    { iataCode: 'SFO', cityName: 'San Francisco',name: 'San Francisco International Airport',       countryName: 'United States' },
  ],
  'usa':                  [
    { iataCode: 'JFK', cityName: 'New York',     name: 'John F. Kennedy International Airport',     countryName: 'United States' },
    { iataCode: 'LAX', cityName: 'Los Angeles',  name: 'Los Angeles International Airport',         countryName: 'United States' },
    { iataCode: 'ORD', cityName: 'Chicago',      name: 'O\'Hare International Airport',             countryName: 'United States' },
    { iataCode: 'DFW', cityName: 'Dallas',       name: 'Dallas/Fort Worth International Airport',   countryName: 'United States' },
  ],
  'america':              [
    { iataCode: 'JFK', cityName: 'New York',     name: 'John F. Kennedy International Airport',     countryName: 'United States' },
    { iataCode: 'LAX', cityName: 'Los Angeles',  name: 'Los Angeles International Airport',         countryName: 'United States' },
    { iataCode: 'ORD', cityName: 'Chicago',      name: 'O\'Hare International Airport',             countryName: 'United States' },
  ],
  'canada':               [
    { iataCode: 'YYZ', cityName: 'Toronto',      name: 'Toronto Pearson International Airport',     countryName: 'Canada' },
    { iataCode: 'YVR', cityName: 'Vancouver',    name: 'Vancouver International Airport',           countryName: 'Canada' },
    { iataCode: 'YUL', cityName: 'Montreal',     name: 'Montréal-Trudeau International Airport',    countryName: 'Canada' },
    { iataCode: 'YYC', cityName: 'Calgary',      name: 'Calgary International Airport',             countryName: 'Canada' },
  ],
  'australia':            [
    { iataCode: 'SYD', cityName: 'Sydney',       name: 'Sydney Kingsford Smith Airport',            countryName: 'Australia' },
    { iataCode: 'MEL', cityName: 'Melbourne',    name: 'Melbourne Airport',                         countryName: 'Australia' },
    { iataCode: 'BNE', cityName: 'Brisbane',     name: 'Brisbane Airport',                          countryName: 'Australia' },
    { iataCode: 'PER', cityName: 'Perth',        name: 'Perth Airport',                             countryName: 'Australia' },
  ],
  'germany':              [
    { iataCode: 'FRA', cityName: 'Frankfurt',    name: 'Frankfurt Airport',                         countryName: 'Germany' },
    { iataCode: 'MUC', cityName: 'Munich',       name: 'Munich Airport',                            countryName: 'Germany' },
    { iataCode: 'BER', cityName: 'Berlin',       name: 'Berlin Brandenburg Airport',                countryName: 'Germany' },
    { iataCode: 'DUS', cityName: 'Düsseldorf',   name: 'Düsseldorf Airport',                        countryName: 'Germany' },
  ],
  'france':               [
    { iataCode: 'CDG', cityName: 'Paris',        name: 'Charles de Gaulle Airport',                 countryName: 'France' },
    { iataCode: 'ORY', cityName: 'Paris',        name: 'Paris Orly Airport',                        countryName: 'France' },
    { iataCode: 'NCE', cityName: 'Nice',         name: 'Nice Côte d\'Azur Airport',                 countryName: 'France' },
    { iataCode: 'MRS', cityName: 'Marseille',    name: 'Marseille Provence Airport',                countryName: 'France' },
  ],
  'turkey':               [
    { iataCode: 'IST', cityName: 'Istanbul',     name: 'Istanbul Airport',                          countryName: 'Turkey' },
    { iataCode: 'SAW', cityName: 'Istanbul',     name: 'Sabiha Gökçen International Airport',       countryName: 'Turkey' },
    { iataCode: 'AYT', cityName: 'Antalya',      name: 'Antalya Airport',                           countryName: 'Turkey' },
    { iataCode: 'ESB', cityName: 'Ankara',       name: 'Esenboğa International Airport',            countryName: 'Turkey' },
  ],
  'china':                [
    { iataCode: 'PEK', cityName: 'Beijing',      name: 'Beijing Capital International Airport',     countryName: 'China' },
    { iataCode: 'PVG', cityName: 'Shanghai',     name: 'Shanghai Pudong International Airport',     countryName: 'China' },
    { iataCode: 'CAN', cityName: 'Guangzhou',    name: 'Guangzhou Baiyun International Airport',    countryName: 'China' },
    { iataCode: 'SZX', cityName: 'Shenzhen',     name: 'Shenzhen Bao\'an International Airport',    countryName: 'China' },
  ],
  'japan':                [
    { iataCode: 'NRT', cityName: 'Tokyo',        name: 'Narita International Airport',              countryName: 'Japan' },
    { iataCode: 'HND', cityName: 'Tokyo',        name: 'Haneda Airport',                            countryName: 'Japan' },
    { iataCode: 'KIX', cityName: 'Osaka',        name: 'Kansai International Airport',              countryName: 'Japan' },
    { iataCode: 'NGO', cityName: 'Nagoya',       name: 'Chubu Centrair International Airport',      countryName: 'Japan' },
  ],
  'malaysia':             [
    { iataCode: 'KUL', cityName: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport',        countryName: 'Malaysia' },
    { iataCode: 'PEN', cityName: 'Penang',       name: 'Penang International Airport',              countryName: 'Malaysia' },
    { iataCode: 'BKI', cityName: 'Kota Kinabalu',name: 'Kota Kinabalu International Airport',       countryName: 'Malaysia' },
  ],
  'indonesia':            [
    { iataCode: 'CGK', cityName: 'Jakarta',      name: 'Soekarno-Hatta International Airport',      countryName: 'Indonesia' },
    { iataCode: 'DPS', cityName: 'Bali',         name: 'Ngurah Rai International Airport',          countryName: 'Indonesia' },
    { iataCode: 'SUB', cityName: 'Surabaya',     name: 'Juanda International Airport',              countryName: 'Indonesia' },
  ],
  'thailand':             [
    { iataCode: 'BKK', cityName: 'Bangkok',      name: 'Suvarnabhumi Airport',                      countryName: 'Thailand' },
    { iataCode: 'DMK', cityName: 'Bangkok',      name: 'Don Mueang International Airport',          countryName: 'Thailand' },
    { iataCode: 'HKT', cityName: 'Phuket',       name: 'Phuket International Airport',              countryName: 'Thailand' },
    { iataCode: 'CNX', cityName: 'Chiang Mai',   name: 'Chiang Mai International Airport',          countryName: 'Thailand' },
  ],
  'iran':                 [
    { iataCode: 'IKA', cityName: 'Tehran',       name: 'Imam Khomeini International Airport',       countryName: 'Iran' },
    { iataCode: 'MHD', cityName: 'Mashhad',      name: 'Mashhad International Airport',             countryName: 'Iran' },
    { iataCode: 'SYZ', cityName: 'Shiraz',       name: 'Shiraz International Airport',              countryName: 'Iran' },
  ],
  'afghanistan':          [
    { iataCode: 'KBL', cityName: 'Kabul',        name: 'Hamid Karzai International Airport',        countryName: 'Afghanistan' },
    { iataCode: 'KDH', cityName: 'Kandahar',     name: 'Kandahar International Airport',            countryName: 'Afghanistan' },
  ],
  'egypt':                [
    { iataCode: 'CAI', cityName: 'Cairo',        name: 'Cairo International Airport',               countryName: 'Egypt' },
    { iataCode: 'HRG', cityName: 'Hurghada',     name: 'Hurghada International Airport',            countryName: 'Egypt' },
    { iataCode: 'SSH', cityName: 'Sharm El Sheikh',name: 'Sharm El-Sheikh International Airport',   countryName: 'Egypt' },
    { iataCode: 'HBE', cityName: 'Alexandria',   name: 'Borg El Arab Airport',                      countryName: 'Egypt' },
  ],
  'italy':                [
    { iataCode: 'FCO', cityName: 'Rome',         name: 'Leonardo da Vinci–Fiumicino Airport',       countryName: 'Italy' },
    { iataCode: 'MXP', cityName: 'Milan',        name: 'Milan Malpensa Airport',                    countryName: 'Italy' },
    { iataCode: 'VCE', cityName: 'Venice',       name: 'Venice Marco Polo Airport',                 countryName: 'Italy' },
    { iataCode: 'NAP', cityName: 'Naples',       name: 'Naples International Airport',              countryName: 'Italy' },
  ],
  'spain':                [
    { iataCode: 'MAD', cityName: 'Madrid',       name: 'Adolfo Suárez Madrid-Barajas Airport',      countryName: 'Spain' },
    { iataCode: 'BCN', cityName: 'Barcelona',    name: 'Josep Tarradellas Barcelona-El Prat Airport',countryName: 'Spain' },
    { iataCode: 'AGP', cityName: 'Málaga',       name: 'Málaga Airport',                            countryName: 'Spain' },
    { iataCode: 'PMI', cityName: 'Palma',        name: 'Palma de Mallorca Airport',                 countryName: 'Spain' },
  ],
  'netherlands':          [
    { iataCode: 'AMS', cityName: 'Amsterdam',    name: 'Amsterdam Airport Schiphol',                countryName: 'Netherlands' },
  ],
  'russia':               [
    { iataCode: 'SVO', cityName: 'Moscow',       name: 'Sheremetyevo International Airport',        countryName: 'Russia' },
    { iataCode: 'DME', cityName: 'Moscow',       name: 'Domodedovo International Airport',          countryName: 'Russia' },
    { iataCode: 'LED', cityName: 'St Petersburg',name: 'Pulkovo Airport',                           countryName: 'Russia' },
  ],
  'brazil':               [
    { iataCode: 'GRU', cityName: 'São Paulo',    name: 'São Paulo/Guarulhos International Airport', countryName: 'Brazil' },
    { iataCode: 'GIG', cityName: 'Rio de Janeiro',name: 'Rio de Janeiro–Galeão International Airport',countryName: 'Brazil' },
    { iataCode: 'BSB', cityName: 'Brasília',     name: 'Brasília International Airport',            countryName: 'Brazil' },
  ],
  'south africa':         [
    { iataCode: 'JNB', cityName: 'Johannesburg', name: 'O. R. Tambo International Airport',         countryName: 'South Africa' },
    { iataCode: 'CPT', cityName: 'Cape Town',    name: 'Cape Town International Airport',           countryName: 'South Africa' },
    { iataCode: 'DUR', cityName: 'Durban',       name: 'King Shaka International Airport',          countryName: 'South Africa' },
  ],
  'nigeria':              [
    { iataCode: 'LOS', cityName: 'Lagos',        name: 'Murtala Muhammed International Airport',   countryName: 'Nigeria' },
    { iataCode: 'ABV', cityName: 'Abuja',        name: 'Nnamdi Azikiwe International Airport',      countryName: 'Nigeria' },
  ],
  'kenya':                [
    { iataCode: 'NBO', cityName: 'Nairobi',      name: 'Jomo Kenyatta International Airport',       countryName: 'Kenya' },
    { iataCode: 'MBA', cityName: 'Mombasa',      name: 'Moi International Airport',                 countryName: 'Kenya' },
  ],
  'morocco':              [
    { iataCode: 'CMN', cityName: 'Casablanca',   name: 'Mohammed V International Airport',          countryName: 'Morocco' },
    { iataCode: 'RAK', cityName: 'Marrakesh',    name: 'Marrakesh Menara Airport',                  countryName: 'Morocco' },
    { iataCode: 'FEZ', cityName: 'Fes',          name: 'Fes-Saïss Airport',                        countryName: 'Morocco' },
  ],
  'sri lanka':            [
    { iataCode: 'CMB', cityName: 'Colombo',      name: 'Bandaranaike International Airport',        countryName: 'Sri Lanka' },
  ],
  'nepal':                [
    { iataCode: 'KTM', cityName: 'Kathmandu',    name: 'Tribhuvan International Airport',           countryName: 'Nepal' },
  ],
  'oman':                 [
    { iataCode: 'MCT', cityName: 'Muscat',       name: 'Muscat International Airport',              countryName: 'Oman' },
    { iataCode: 'SLL', cityName: 'Salalah',      name: 'Salalah Airport',                           countryName: 'Oman' },
  ],
  'qatar':                [
    { iataCode: 'DOH', cityName: 'Doha',         name: 'Hamad International Airport',               countryName: 'Qatar' },
  ],
  'kuwait':               [
    { iataCode: 'KWI', cityName: 'Kuwait City',  name: 'Kuwait International Airport',              countryName: 'Kuwait' },
  ],
  'bahrain':              [
    { iataCode: 'BAH', cityName: 'Manama',       name: 'Bahrain International Airport',             countryName: 'Bahrain' },
  ],
  'iraq':                 [
    { iataCode: 'BGW', cityName: 'Baghdad',      name: 'Baghdad International Airport',             countryName: 'Iraq' },
    { iataCode: 'BSR', cityName: 'Basra',        name: 'Basra International Airport',               countryName: 'Iraq' },
    { iataCode: 'EBL', cityName: 'Erbil',        name: 'Erbil International Airport',               countryName: 'Iraq' },
  ],
  'singapore':            [
    { iataCode: 'SIN', cityName: 'Singapore',    name: 'Singapore Changi Airport',                  countryName: 'Singapore' },
  ],
  'philippines':          [
    { iataCode: 'MNL', cityName: 'Manila',       name: 'Ninoy Aquino International Airport',        countryName: 'Philippines' },
    { iataCode: 'CEB', cityName: 'Cebu',         name: 'Mactan-Cebu International Airport',         countryName: 'Philippines' },
  ],
  'vietnam':              [
    { iataCode: 'SGN', cityName: 'Ho Chi Minh City', name: 'Tan Son Nhat International Airport',    countryName: 'Vietnam' },
    { iataCode: 'HAN', cityName: 'Hanoi',        name: 'Noi Bai International Airport',             countryName: 'Vietnam' },
    { iataCode: 'DAD', cityName: 'Da Nang',      name: 'Da Nang International Airport',             countryName: 'Vietnam' },
  ],
  'south korea':          [
    { iataCode: 'ICN', cityName: 'Seoul',        name: 'Incheon International Airport',             countryName: 'South Korea' },
    { iataCode: 'GMP', cityName: 'Seoul',        name: 'Gimpo International Airport',               countryName: 'South Korea' },
    { iataCode: 'PUS', cityName: 'Busan',        name: 'Gimhae International Airport',              countryName: 'South Korea' },
  ],
  'korea':                [
    { iataCode: 'ICN', cityName: 'Seoul',        name: 'Incheon International Airport',             countryName: 'South Korea' },
    { iataCode: 'GMP', cityName: 'Seoul',        name: 'Gimpo International Airport',               countryName: 'South Korea' },
  ],
  'portugal':             [
    { iataCode: 'LIS', cityName: 'Lisbon',       name: 'Humberto Delgado Airport',                  countryName: 'Portugal' },
    { iataCode: 'OPO', cityName: 'Porto',        name: 'Francisco de Sá Carneiro Airport',          countryName: 'Portugal' },
    { iataCode: 'FAO', cityName: 'Faro',         name: 'Faro Airport',                              countryName: 'Portugal' },
  ],
  'greece':               [
    { iataCode: 'ATH', cityName: 'Athens',       name: 'Athens International Airport',              countryName: 'Greece' },
    { iataCode: 'SKG', cityName: 'Thessaloniki', name: 'Thessaloniki Airport',                      countryName: 'Greece' },
    { iataCode: 'HER', cityName: 'Heraklion',    name: 'Heraklion International Airport',           countryName: 'Greece' },
  ],
  'switzerland':          [
    { iataCode: 'ZRH', cityName: 'Zurich',       name: 'Zurich Airport',                            countryName: 'Switzerland' },
    { iataCode: 'GVA', cityName: 'Geneva',       name: 'Geneva Airport',                            countryName: 'Switzerland' },
  ],
};

// ISO 3166-1 alpha-2 code for each country key
const COUNTRY_ISO = {
  'pakistan': 'PK', 'india': 'IN', 'bangladesh': 'BD',
  'united arab emirates': 'AE', 'uae': 'AE',
  'saudi arabia': 'SA', 'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB',
  'united states': 'US', 'usa': 'US', 'america': 'US',
  'canada': 'CA', 'australia': 'AU', 'germany': 'DE', 'france': 'FR',
  'turkey': 'TR', 'china': 'CN', 'japan': 'JP', 'malaysia': 'MY',
  'indonesia': 'ID', 'thailand': 'TH', 'iran': 'IR', 'afghanistan': 'AF',
  'egypt': 'EG', 'italy': 'IT', 'spain': 'ES', 'netherlands': 'NL',
  'russia': 'RU', 'brazil': 'BR', 'south africa': 'ZA', 'nigeria': 'NG',
  'kenya': 'KE', 'morocco': 'MA', 'sri lanka': 'LK', 'nepal': 'NP',
  'oman': 'OM', 'qatar': 'QA', 'kuwait': 'KW', 'bahrain': 'BH',
  'iraq': 'IQ', 'singapore': 'SG', 'philippines': 'PH', 'vietnam': 'VN',
  'south korea': 'KR', 'korea': 'KR', 'portugal': 'PT', 'greece': 'GR',
  'switzerland': 'CH',
};

/**
 * Find the first country whose name starts with (or equals) the keyword.
 * Returns { key, displayName, isoCode, airports } or null.
 */
const findCountryMatch = (keyword) => {
  const kw = keyword.toLowerCase().trim();
  for (const [key, airports] of Object.entries(COUNTRY_AIRPORTS)) {
    if (key.startsWith(kw) || kw === key) {
      const displayName = key.replace(/\b\w/g, c => c.toUpperCase()); // "pakistan" → "Pakistan"
      return { key, displayName, isoCode: COUNTRY_ISO[key] || key.toUpperCase().slice(0, 2), airports };
    }
  }
  return null;
};

/**
 * GET /api/flights/airports?keyword=Paris
 * Proxies Travelpayouts places2 autocomplete (free, no auth required).
 * Also matches country names (e.g. "Pakistan" → KHI, LHE, ISB).
 */
export const getAirports = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'keyword must be at least 2 characters' });
    }

    // ── Country name match ────────────────────────────────────────────────────
    const countryMatch = findCountryMatch(keyword.trim());

    // ── Travelpayouts city/airport search ─────────────────────────────────────
    let apiLocations = [];
    try {
      const excludedCodes = new Set(countryMatch ? countryMatch.airports.map(a => a.iataCode) : []);
      const qs = `term=${encodeURIComponent(keyword.trim())}&locale=en&types[]=airport&types[]=city`;
      const apiRes = await fetch(`https://autocomplete.travelpayouts.com/places2?${qs}`);
      if (apiRes.ok) {
        const raw = await apiRes.json();
        apiLocations = raw
          .filter(item => item.code && !excludedCodes.has(item.code))
          .sort((a, b) => (a.type === 'airport' ? -1 : 1))
          .reduce((acc, item) => {
            if (!excludedCodes.has(item.code)) {
              excludedCodes.add(item.code);
              acc.push({
                iataCode:    item.code,
                name:        item.name,
                cityName:    item.city_name || item.name,
                countryName: item.country_name || '',
              });
            }
            return acc;
          }, []);
      }
    } catch { /* non-fatal */ }

    let locations = [];
    if (countryMatch) {
      // Top entry: the whole country (isCountry: true)
      const countryEntry = {
        iataCode:        countryMatch.isoCode,
        name:            `${countryMatch.displayName} — All airports`,
        cityName:        countryMatch.displayName,
        countryName:     countryMatch.displayName,
        isCountry:       true,
        countryAirports: countryMatch.airports,
      };
      // Then the individual cities of that country, then API results
      locations = [countryEntry, ...countryMatch.airports, ...apiLocations].slice(0, 10);
    } else {
      locations = apiLocations.slice(0, 10);
    }

    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('❌ Airport search error:', error.message);
    res.status(500).json({ success: false, message: 'Airport search failed', error: error.message });
  }
};

/**
 * POST /api/flights/search
 * Body: { originCode, destinationCode, departureDate, returnDate?, adults, children?, currencyCode? }
 */
export const searchFlights = async (req, res) => {
  try {
    const {
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      adults,
      children = 0,
      currencyCode = 'USD',
    } = req.body;

    console.log(`📋 Flight search: ${originCode} → ${destinationCode} on ${departureDate}, adults: ${adults}`);

    const flights = await amadeusSearchFlights({
      originCode,
      destinationCode,
      departureDate,
      returnDate: returnDate || null,
      adults: Number(adults),
      children: Number(children),
      currencyCode,
    });

    console.log(`✅ Flight search complete — ${flights.length} result(s)`);

    res.status(200).json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: {
        flights,
        count: flights.length,
        searchParams: {
          originCode: originCode.toUpperCase(),
          destinationCode: destinationCode.toUpperCase(),
          departureDate,
          returnDate: returnDate || null,
          adults: Number(adults),
          children: Number(children),
        },
      },
    });
  } catch (error) {
    console.error('❌ Flight search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search flights',
      error: error.message,
    });
  }
};

/**
 * GET /api/flights/cheap-price?origin=KHI&destination=DXB&departDate=2026-05-01
 * Returns cheapest cached TP price for a route/month (instant, no heavy search).
 */
export const getCheapPriceHandler = async (req, res) => {
  try {
    const { origin, destination, departDate } = req.query;
    if (!origin || !destination || !departDate)
      return res.status(400).json({ success: false, message: 'origin, destination and departDate required' });
    const result = await getCheapPrice({ origin, destination, departDate });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/flights/google-search?origin=LAX&destination=JFK&departureDate=2026-04-15&adults=1[&returnDate=...]
 * Returns real-time flights via Google Flights (RapidAPI). Book Now → Aviasales affiliate.
 */
export const searchFlightsGoogleHandler = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'ECONOMY' } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, message: 'origin, destination and departureDate are required' });
    }

    console.log(`🌐 Google Flights search: ${origin} → ${destination} on ${departureDate}`);

    const { topFlights, otherFlights } = await searchFlightsGoogle({
      origin,
      destination,
      departureDate,
      returnDate:  returnDate || null,
      adults:      Number(adults),
      travelClass,
    });

    const flights = [...(topFlights || []), ...(otherFlights || [])];

    if (flights.length === 0) {
      console.warn(`⚠️  Google Flights: 0 results for ${origin} → ${destination} on ${departureDate} — frontend will fall back to TP`);
    } else {
      console.log(`✅ Google Flights: ${topFlights.length} top + ${otherFlights.length} other = ${flights.length} total`);
    }

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found',
      data: { topFlights: topFlights || [], otherFlights: otherFlights || [], flights, count: flights.length },
    });
  } catch (error) {
    console.error(`❌ Google Flights error (${req.query.origin} → ${req.query.destination}): ${error.message} — frontend will fall back to TP`);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/tp-search?origin=LHR&destination=DXB&departureAt=2026-04-01[&returnAt=2026-04-05][&limit=20]
 * Returns real flight offers via Travelpayouts Aviasales API.
 */
export const searchFlightsTravelpayouts = async (req, res) => {
  try {
    const { origin, destination, departureAt, returnAt, limit } = req.query;

    console.log(`✈️  TP flight search: ${origin} → ${destination} on ${departureAt}`);

    const flights = await tpSearchFlights({
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureAt,
      returnAt:    returnAt || null,
      limit:       limit ? parseInt(limit, 10) : 20,
    });

    console.log(`✅ TP flight search complete — ${flights.length} result(s)`);

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found for this route and date',
      data: { flights, count: flights.length },
    });
  } catch (error) {
    console.error('❌ TP flight search error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Flight search failed',
      error: error.message,
    });
  }
};

/**
 * GET /api/flights/duffel-search?origin=LHR&destination=DXB&departureDate=2026-04-15&adults=1[&returnDate=...&travelClass=economy]
 * Returns real-time flights via Duffel API, normalised to FlightCardDuffel shape.
 */
export const searchFlightsDuffelHandler = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults = 1, travelClass = 'economy' } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ success: false, message: 'origin, destination and departureDate are required' });
    }

    console.log(`🛫  Duffel search handler: ${origin} → ${destination} on ${departureDate}`);

    const flights = await searchFlightsDuffel({
      origin,
      destination,
      departureDate,
      returnDate:  returnDate || null,
      adults:      Number(adults),
      travelClass,
    });

    res.json({
      success: true,
      message: flights.length > 0 ? 'Flights found' : 'No flights found',
      data:    { flights, count: flights.length },
    });
  } catch (error) {
    console.error(`❌ Duffel error (${req.query.origin} → ${req.query.destination}): ${error.message}`);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/explore?origin=LHE
 * Returns cheapest prices from origin to all known destinations.
 */
export const exploreDestinationsHandler = async (req, res) => {
  try {
    const { origin } = req.query;
    if (!origin) return res.status(400).json({ success: false, message: 'origin is required' });
    const prices = await getExploreDestinations(origin);
    res.json({ success: true, data: { prices } });
  } catch (error) {
    console.error('❌ Explore destinations error:', error.message);
    res.status(502).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/flights/destination-image?query=Dubai
 * Returns an Unsplash image URL for a destination query.
 * DEPRECATED: Use /api/flights/place-image instead (uses Google Places API with DB caching)
 */
export const getDestinationImageHandler = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      console.warn(`⚠️ Invalid image query: ${query}`);
      return res.status(400).json({ success: false, message: 'query must be at least 2 characters' });
    }

    console.log(`📷 Getting image for query: ${query}`);
    const result = await searchDestinationImage(query.trim());
    
    // Ensure response has the imageUrl at the right level
    const response = {
      success: true,
      data: {
        imageUrl: result?.imageUrl || null,
        source: result?.source || 'none',
        error: result?.error || null,
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Destination image error:', error.message);
    res.status(502).json({ 
      success: false, 
      message: error.message,
      data: {
        imageUrl: null,
        source: 'error',
      }
    });
  }
};

/**
 * GET /api/flights/place-image?placeName=Dubai
 * Returns an accurate image for a place using Google Places API with database caching.
 * 
 * FLOW:
 * 1. Check if place image is cached in database
 * 2. If cache is valid → return cached image (fast)
 * 3. If cache expired/not found → fetch from Google Places API
 * 4. Store fetched images in database for future use
 * 5. Return image URL with cache status
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     imageUrl: "https://...",
 *     source: "cached|google-places|fallback",
 *     cacheStatus: "hit|valid|new|failed|no_photos|error",
 *     placeDetails: { displayName, rating, ... },
 *     cacheInfo: { totalCached: 123, avgFetchCount: 4.5 }
 *   }
 * }
 */
export const getPlaceImageHandler = async (req, res) => {
  try {
    const { placeName } = req.query;
    
    if (!placeName || placeName.trim().length < 2) {
      console.warn(`⚠️ Invalid place name: ${placeName}`);
      return res.status(400).json({ 
        success: false, 
        message: 'placeName must be at least 2 characters' 
      });
    }

    console.log(`\n🖼️  [API] Getting place image for: ${placeName}`);
    
    const result = await getPlaceImageWithCache(placeName.trim());
    
    // Get cache stats for response
    const stats = await getCacheStats();
    
    const response = {
      success: true,
      data: {
        imageUrl: result?.imageUrl || null,
        source: result?.source || 'fallback',
        cacheStatus: result?.cacheStatus || 'error',
        placeDetails: result?.placeDetails || null,
        cacheInfo: {
          totalCached: stats?.activeCacheEntries || 0,
          avgFetchCount: stats?.totalFetches && stats?.activeCacheEntries 
            ? (stats.totalFetches / stats.activeCacheEntries).toFixed(2)
            : 0
        }
      }
    };
    
    console.log(`✅ [API] Response - Source: ${result?.source}, Status: ${result?.cacheStatus}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ [API] Place image error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch place image',
      error: error.message,
      data: {
        imageUrl: null,
        source: 'error',
        cacheStatus: 'error'
      }
    });
  }
};

/**
 * POST /api/flights/place-images-batch
 * Fetch images for multiple places at once (optimized with Promise.allSettled)
 * 
 * REQUEST BODY:
 * { placeNames: ["Dubai", "Paris", "Tokyo"] }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     imageMap: {
 *       "Dubai": { imageUrl, source, cacheStatus, ... },
 *       "Paris": { imageUrl, source, cacheStatus, ... },
 *       "Tokyo": { imageUrl, source, cacheStatus, ... }
 *     },
 *     totalPlaces: 3,
 *     cachedCount: 2,
 *     newlyFetchedCount: 1
 *   }
 * }
 */
export const getPlaceImagesBatchHandler = async (req, res) => {
  try {
    const { placeNames } = req.body;
    
    if (!Array.isArray(placeNames) || placeNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'placeNames must be a non-empty array'
      });
    }

    if (placeNames.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 places allowed per request'
      });
    }

    console.log(`\n📦 [API] Batch fetching images for ${placeNames.length} places`);
    
    const imageMap = await getPlaceImagesForMultiplePlaces(placeNames);
    
    // Count cache statuses
    const stats = {
      cached: 0,
      new: 0,
      fallback: 0,
      error: 0
    };

    Object.values(imageMap).forEach(item => {
      if (item.cacheStatus === 'hit' || item.cacheStatus === 'valid') {
        stats.cached++;
      } else if (item.cacheStatus === 'new') {
        stats.new++;
      } else if (item.cacheStatus === 'fallback' || item.cacheStatus === 'no_photos') {
        stats.fallback++;
      } else {
        stats.error++;
      }
    });

    const response = {
      success: true,
      data: {
        imageMap,
        totalPlaces: placeNames.length,
        stats: {
          cachedCount: stats.cached,
          newlyFetchedCount: stats.new,
          fallbackCount: stats.fallback,
          errorCount: stats.error
        }
      }
    };

    console.log(`✅ [API] Batch complete - Cached: ${stats.cached}, New: ${stats.new}, Fallback: ${stats.fallback}`);
    res.json(response);

  } catch (error) {
    console.error('❌ [API] Batch place images error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Batch place image fetch failed',
      error: error.message
    });
  }
};

/**
 * DELETE /api/flights/cache-clear
 * Wipes all cached place images so fresh ones are fetched with correct URLs
 */
export const clearPlaceImageCacheHandler = async (req, res) => {
  try {
    const result = await PlaceImage.deleteMany({});
    console.log(`🧹 Cleared ${result.deletedCount} cached place image entries`);
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} cached entries`
    });
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

/**
 * GET /api/flights/cache-stats
 * Returns cache statistics for monitoring
 */
export const getCacheStatsHandler = async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Cache stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cache statistics',
      error: error.message
    });
  }
};
