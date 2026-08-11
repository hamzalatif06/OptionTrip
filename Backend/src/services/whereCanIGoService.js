import { PASSPORTS, DESTINATIONS, VISA_RULES, PASSPORT_ALIAS, FALLBACK_RULE } from '../data/visaData.js';

const R_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;
const haversineKm = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
            Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};
const kmToFlightHrs = (km) => {
  const hrs = 0.75 + km / 800;
  return Math.max(1, Math.round(hrs * 2) / 2);
};

const ENTRY_WEIGHT = {
  visa_free:        10,
  visa_on_arrival:   8,
  e_visa:            6,
  embassy_visa:      3
};

const ENTRY_LABEL = {
  visa_free:        'Visa-free',
  visa_on_arrival:  'Visa on arrival',
  e_visa:           'e-Visa',
  embassy_visa:     'Embassy visa'
};

export const computeEasyScore = (rule, transitHrs) => {
  let score = ENTRY_WEIGHT[rule.entry] ?? 3;

  if (rule.processing_days > 15)
    score -= 2;
  else if (rule.processing_days > 7) score -= 1;
  else if (rule.processing_days > 3) score -= 0.5;

  const docCount = (rule.docs || []).length;
  if      (docCount >= 6) score -= 1.5;
  else if (docCount >= 4) score -= 0.75;

  const hrs = typeof transitHrs === 'number' ? transitHrs : 10;
  if      (hrs >= 15) score -= 2;
  else if (hrs >= 10) score -= 1;
  else if (hrs >= 6)  score -= 0.5;

  const clamped = Math.max(1, Math.min(10, score));
  return Math.round(clamped * 2) / 2;
};

const easyBucket = (score) =>
  score >= 8 ? 'easy' : score >= 5 ? 'moderate' : 'hard';

const isMet = (v) => (typeof v === 'number' ? v >= 2 : !!v);

const projectComfortBooleans = (c = {}) => ({
  halal:        isMet(c.halal),
  prayer:       isMet(c.prayer),
  conservative: isMet(c.conservative),
  women_solo:   isMet(c.women_solo)
});

export const getRule = (passportCode, destinationCode) => {
  const direct = VISA_RULES[passportCode]?.[destinationCode];
  if (direct) return direct;

  const alias = PASSPORT_ALIAS[passportCode];
  if (alias) {
    const inherited = VISA_RULES[alias]?.[destinationCode];
    if (inherited) return inherited;
  }
  return FALLBACK_RULE();
};

export const computeTransit = (passport, dest) => {
  if (!passport || !dest) return null;
  const explicit = dest.transit_hrs?.[passport.code];
  if (typeof explicit === 'number') return explicit;
  if (typeof passport.lat === 'number' && typeof dest.lat === 'number' &&
      typeof passport.lng === 'number' && typeof dest.lng === 'number') {
    return kmToFlightHrs(haversineKm(
      { lat: passport.lat, lng: passport.lng },
      { lat: dest.lat,     lng: dest.lng }
    ));
  }
  return null;
};

export const listDestinationsFor = (passportCode, opts = {}) => {
  const {
    hideEmbassy = false,
    comfort     = {},
    sortBy      = 'easy'
  } = opts;

  const passport = PASSPORTS.find(p => p.code === passportCode);
  if (!passport) {
    const err = new Error(`Unknown passport code: ${passportCode}`);
    err.status = 400;
    throw err;
  }

  const rows = DESTINATIONS.map(dest => {
    const rule       = getRule(passportCode, dest.code);
    const transitHrs = computeTransit(passport, dest);
    const score      = computeEasyScore(rule, transitHrs);
    const comfortBool = projectComfortBooleans(dest.comfort);

    return {
      code:            dest.code,
      name:            dest.name,
      flag:            dest.flag,
      region:          dest.region,
      hero:            dest.hero,
      pitch:           dest.pitch,
      entry:           rule.entry,
      entry_label:     ENTRY_LABEL[rule.entry] || rule.entry,
      processing_days: rule.processing_days,
      documents:       rule.docs,
      stay_days:       rule.stay,
      changed_recently: !!rule.changed_recently,
      last_verified:   rule.last_verified,
      rule_notes:      rule.notes || null,
      transit_hrs:     transitHrs,
      easy_score:      score,
      easy_bucket:     easyBucket(score),
      comfort:         comfortBool,
      comfort_raw:     dest.comfort
    };
  });

  let filtered = hideEmbassy
    ? rows.filter(r => r.entry !== 'embassy_visa')
    : rows;

  const activeComfort = Object.entries(comfort || {})
    .filter(([, v]) => v === true || v === 'true')
    .map(([k]) => k);

  if (activeComfort.length) {
    filtered = filtered.filter(r => activeComfort.every(k => r.comfort[k]));
  }

  const sorters = {
    easy:    (a, b) => b.easy_score - a.easy_score || a.name.localeCompare(b.name),
    alpha:   (a, b) => a.name.localeCompare(b.name),
    transit: (a, b) => (a.transit_hrs ?? 99) - (b.transit_hrs ?? 99)
  };
  filtered.sort(sorters[sortBy] || sorters.easy);

  return { passport, destinations: filtered };
};

export const getDestinationDetail = (passportCode, destinationCode) => {
  const passport = PASSPORTS.find(p => p.code === passportCode);
  const dest     = DESTINATIONS.find(d => d.code === destinationCode);
  if (!passport) { const e = new Error('Unknown passport');    e.status = 400; throw e; }
  if (!dest)     { const e = new Error('Unknown destination'); e.status = 404; throw e; }

  const rule       = getRule(passportCode, destinationCode);
  const transitHrs = computeTransit(passport, dest);
  const score      = computeEasyScore(rule, transitHrs);

  return {
    passport,
    destination: {
      code:  dest.code,
      name:  dest.name,
      flag:  dest.flag,
      region: dest.region,
      hero:  dest.hero,
      pitch: dest.pitch,
      comfort:      projectComfortBooleans(dest.comfort),
      comfort_raw:  dest.comfort
    },
    entry: {
      type:            rule.entry,
      type_label:      ENTRY_LABEL[rule.entry] || rule.entry,
      processing_days: rule.processing_days,
      documents:       rule.docs,
      stay_days:       rule.stay,
      changed_recently: !!rule.changed_recently,
      last_verified:   rule.last_verified,
      notes:           rule.notes || null
    },
    transit_hrs: transitHrs,
    easy_score:  score,
    easy_bucket: easyBucket(score)
  };
};

export const listPassports = () => PASSPORTS;

export default {
  listPassports,
  listDestinationsFor,
  getDestinationDetail,
  computeEasyScore,
  getRule
};
