const escapeXml = (s) =>
  String(s ?? '').replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch]));

export const buildTravelStatsCard = ({ name, countriesVisited, citiesVisited, tripsCreated }) => {
  const title = `${escapeXml(name)}'s Travel Map`;
  const subtitle = `${countriesVisited} countr${countriesVisited === 1 ? 'y' : 'ies'} visited on OptionTrip`;
  const titleFontSize = title.length > 28 ? 44 : title.length > 20 ? 56 : 72;

  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0A539D"/>
        <stop offset="100%" stop-color="#029e9d"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <circle cx="900" cy="180" r="260" fill="rgba(255,255,255,0.06)"/>
    <circle cx="120" cy="920" r="200" fill="rgba(255,255,255,0.06)"/>

    <text x="80" y="150" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="rgba(255,255,255,0.75)" letter-spacing="2">OPTIONTRIP</text>

    <text x="80" y="420" font-family="Arial, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#ffffff">${title}</text>
    <text x="80" y="475" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.85)">${escapeXml(subtitle)}</text>

    <g transform="translate(80, 600)">
      <g>
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="88" font-weight="800" fill="#ffffff">${countriesVisited}</text>
        <text x="0" y="45" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" letter-spacing="1">COUNTRIES</text>
      </g>
      <g transform="translate(280, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="88" font-weight="800" fill="#ffffff">${citiesVisited}</text>
        <text x="0" y="45" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" letter-spacing="1">CITIES</text>
      </g>
      <g transform="translate(560, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="88" font-weight="800" fill="#ffffff">${tripsCreated}</text>
        <text x="0" y="45" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" letter-spacing="1">TRIPS</text>
      </g>
    </g>

    <text x="80" y="1000" font-family="Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.6)">optiontrip.com — Your Personal Travel Partner Vi</text>
  </svg>`;
};

export const buildYearlyReportCard = ({ name, year, countriesVisited, citiesVisited, routesTraveled, tripStoriesCreated, mostVisitedCountry }) => {
  const title = `My ${year} Travel Year`;
  const subtitle = `${escapeXml(name)}'s year in travel on OptionTrip`;
  const highlight = mostVisitedCountry ? `Most visited: ${escapeXml(mostVisitedCountry)}` : '';

  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F30F89"/>
        <stop offset="100%" stop-color="#0A539D"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg2)"/>
    <circle cx="920" cy="160" r="240" fill="rgba(255,255,255,0.06)"/>
    <circle cx="100" cy="940" r="220" fill="rgba(255,255,255,0.06)"/>

    <text x="80" y="150" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="rgba(255,255,255,0.75)" letter-spacing="2">OPTIONTRIP</text>

    <text x="80" y="420" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">${title}</text>
    <text x="80" y="475" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.85)">${subtitle}</text>

    <g transform="translate(80, 600)">
      <g>
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${countriesVisited}</text>
        <text x="0" y="42" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)" letter-spacing="1">COUNTRIES</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${citiesVisited}</text>
        <text x="0" y="42" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)" letter-spacing="1">CITIES</text>
      </g>
      <g transform="translate(480, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${routesTraveled}</text>
        <text x="0" y="42" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)" letter-spacing="1">TRIPS</text>
      </g>
      <g transform="translate(720, 0)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${tripStoriesCreated}</text>
        <text x="0" y="42" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)" letter-spacing="1">TIPS</text>
      </g>
    </g>

    ${highlight ? `<text x="80" y="740" font-family="Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.9)">${highlight}</text>` : ''}

    <text x="80" y="1000" font-family="Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.6)">optiontrip.com — Your Personal Travel Partner Vi</text>
  </svg>`;
};

export default { buildTravelStatsCard, buildYearlyReportCard };
