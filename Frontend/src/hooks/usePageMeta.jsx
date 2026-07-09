import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'OptionTrip';
const DEFAULT_IMAGE = '/images/travel.png';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://optiontrip.com';
const HREFLANG_LANGS = ['en', 'ru', 'de', 'fr', 'it', 'es', 'pl', 'uk', 'tr', 'hu', 'sv', 'pt', 'sr', 'ar', 'zh', 'ja', 'vi', 'th', 'ko', 'hi', 'bn', 'id'];

/**
 * Drop-in component that sets page-level <head> meta tags.
 *
 * Usage:
 *   <PageMeta
 *     title="Search Flights"
 *     description="Find the best flight deals..."
 *     image="https://..."    // optional
 *     path="/flights"        // optional, defaults to window.location.pathname
 *   />
 */
const PageMeta = ({ title, description, image, path }) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const metaDesc = description || 'AI-powered travel planning. Describe your dream trip and get a personalized itinerary, flights, and hotels in minutes.';
  const metaImage = image ? image : `${SITE_URL}${DEFAULT_IMAGE}`;
  const canonical = `${SITE_URL}${path || (typeof window !== 'undefined' ? window.location.pathname : '')}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* hreflang */}
      <link rel="alternate" hreflang="x-default" href={canonical} />
      {HREFLANG_LANGS.map(lang => (
        <link key={lang} rel="alternate" hreflang={lang} href={`${canonical}${canonical.includes('?') ? '&' : '?'}lang=${lang}`} />
      ))}
    </Helmet>
  );
};

export default PageMeta;
