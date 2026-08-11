import { Helmet } from 'react-helmet-async';

const SITE_NAME     = 'OptionTrip';
const DEFAULT_IMAGE = '/images/travel.png';
const SITE_URL      = import.meta.env.VITE_SITE_URL || 'https://www.optiontrip.com';

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


      {noIndex
        ? <meta name="robots" content="noindex, nofollow, noarchive" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      }


      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image"       content={metaImage} />
      <meta property="og:image:alt"   content={title || SITE_NAME} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:site_name"   content={SITE_NAME} />


      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image"       content={metaImage} />
      <meta name="twitter:image:alt"   content={title || SITE_NAME} />


      {!noIndex && (
        <link rel="alternate" hrefLang="x-default" href={canonical} />
      )}


      {jsonLdArr.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageMeta;
