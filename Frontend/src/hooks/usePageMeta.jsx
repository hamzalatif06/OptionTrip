import { Helmet } from 'react-helmet-async';

const SITE_NAME     = 'OptionTrip';
const DEFAULT_IMAGE = '/images/travel.png';
const SITE_URL      = import.meta.env.VITE_SITE_URL || 'https://www.optiontrip.com';
const HREFLANG_LANGS = ['en', 'ru', 'de', 'fr', 'it', 'es', 'pl', 'uk', 'tr', 'hu', 'sv', 'pt', 'sr', 'ar', 'zh', 'ja', 'vi', 'th', 'ko', 'hi', 'bn', 'id'];

/**
 * Drop-in <head> meta component for every page.
 *
 * Props:
 *   title       — page-specific title (site name is appended automatically)
 *   description — page-specific description
 *   keywords    — comma-separated keyword string (optional)
 *   image       — absolute or relative image URL (falls back to /images/travel.png)
 *   path        — canonical path (defaults to window.location.pathname)
 *   noIndex     — set true on auth/user/dynamic pages that shouldn't appear in Google
 *   jsonLd      — extra JSON-LD object (or array) for schema.org structured data
 *   ogType      — Open Graph type: 'website' | 'article' | 'product' (default 'website')
 *
 * Usage:
 *   <PageMeta
 *     title="Where Can I Go?"
 *     description="Tell us your passport, we show you where you can travel."
 *     keywords="visa requirements, passport, travel discovery, visa free"
 *     path="/where-can-i-go"
 *   />
 */
const PageMeta = ({
  title,
  description,
  keywords,
  image,
  path,
  noIndex   = false,
  jsonLd    = null,
  ogType    = 'website'
}) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Your Personal Travel Partner Vi`;
  const metaDesc  = description || 'Powered by Travel Partner Vi. Describe your dream trip and get a personalized itinerary, flights, stays, and single-day plans in minutes.';
  const metaImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : `${SITE_URL}${DEFAULT_IMAGE}`;
  const canonicalPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  const canonical     = `${SITE_URL}${canonicalPath}`;

  const jsonLdArr = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />

      {/* Robots — noIndex for auth/session pages so they don't leak into search */}
      {noIndex
        ? <meta name="robots" content="noindex, nofollow, noarchive" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      }

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image"       content={metaImage} />
      <meta property="og:image:alt"   content={title || SITE_NAME} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={metaImage} />
      <meta name="twitter:image:alt"   content={title || SITE_NAME} />

      {/* hreflang — only when indexable */}
      {!noIndex && (
        <link rel="alternate" hrefLang="x-default" href={canonical} />
      )}
      {!noIndex && HREFLANG_LANGS.map(lang => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${canonical}${canonical.includes('?') ? '&' : '?'}lang=${lang}`}
        />
      ))}

      {/* Extra JSON-LD structured data (breadcrumbs, articles, product, etc.) */}
      {jsonLdArr.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageMeta;
