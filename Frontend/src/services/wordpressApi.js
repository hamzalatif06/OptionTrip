import axios from 'axios';

const WP_BASE = 'https://blog.optiontrip.com/wp-json/wp/v2';

// _fields controls which top-level post properties are returned.
// featured_media gives WP the image ID to resolve, _links gives it
// the hypermedia links needed for _embed to attach wp:featuredmedia,
// author and wp:term into the _embedded object.
const FIELDS = 'id,slug,title,excerpt,content,link,date,featured_media,_links';

const wpApi = axios.create({
  baseURL: WP_BASE,
  timeout: 10000,
});

/**
 * Fetch a paginated list of posts.
 * @param {number} perPage - Number of posts to return (default 6)
 * @param {number} page    - Page number (default 1)
 */
export const fetchPosts = (perPage = 6, page = 1) =>
  wpApi.get('/posts', {
    params: {
      _embed: true,
      per_page: perPage,
      page,
      _fields: FIELDS,
      _: Date.now(), // cache-bust — always fetch fresh from WordPress
    },
  });

/**
 * Fetch a single post by its slug.
 * @param {string} slug - The post slug from the URL
 */
export const fetchPostBySlug = (slug) =>
  wpApi.get('/posts', {
    params: {
      slug,
      _embed: true,
      _fields: FIELDS,
    },
  });

/**
 * Extract the featured image URL from an embedded post object.
 * Falls back to a placeholder if no image is set.
 * @param {Object} post - WP REST API post object with _embedded
 * @param {string} size - Image size key ('medium_large' | 'full' | 'thumbnail')
 */
export const getFeaturedImage = (post, size = 'medium_large') => {
  try {
    const media = post?._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media?.media_details?.sizes || {};
    // Try requested size first, then common fallbacks, then full source_url
    return (
      sizes[size]?.source_url ||
      sizes['large']?.source_url ||
      sizes['medium_large']?.source_url ||
      sizes['medium']?.source_url ||
      sizes['full']?.source_url ||
      media?.source_url ||
      null
    );
  } catch {
    return null;
  }
};

/**
 * Format a WP date string to a readable format.
 * @param {string} dateStr - ISO date string from WP API
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Strip HTML tags and return plain text (for meta descriptions / truncation).
 * @param {string} html
 * @param {number} maxLength
 */
export const stripHtml = (html = '', maxLength = 160) => {
  const text = html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

export default wpApi;
