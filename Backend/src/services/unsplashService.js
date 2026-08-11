const DEFAULT_QUERY = 'travel,city,landmark';
const UNSPLASH_API_URL = 'https://api.unsplash.com';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const normalizeQuery = (query) => String(query || '').trim().replace(/\s+/g, ' ').toLowerCase();

const getRandomPage = () => {
  return Math.floor(Math.random() * 5) + 1;
};

export const searchDestinationImage = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      console.warn('⚠️ Invalid query provided');
      return {
        imageUrl: null,
        source: 'none',
        error: 'Invalid query',
      };
    }

    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('⚠️ UNSPLASH_ACCESS_KEY not configured');
      return {
        imageUrl: null,
        source: 'none',
        error: 'Access key not configured',
      };
    }

    const normalizedQuery = normalizeQuery(query);
    console.log(`🔍 Fetching image for: ${normalizedQuery}`);
    
    const page = getRandomPage();
    
    const searchUrl = `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(normalizedQuery)}&per_page=3&page=${page}&order_by=relevant&client_id=${UNSPLASH_ACCESS_KEY}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept-Version': 'v1',
      },
      timeout: 8000,
    });

    if (!response.ok) {
      console.error(`❌ Unsplash API error: ${response.status} ${response.statusText} for query: ${normalizedQuery}`);
      return {
        imageUrl: null,
        source: 'unsplash-api',
        error: `API error ${response.status}`,
      };
    }

    const data = await response.json();
    
    const results = data?.results || [];
    
    if (!results || results.length === 0) {
      console.warn(`⚠️ No image found for: ${normalizedQuery}`);
      return {
        imageUrl: null,
        source: 'unsplash-api',
        error: 'No image found',
      };
    }

    const resultIndex = Math.min(1, results.length - 1);
    const photo = results[resultIndex];
    
    if (!photo?.urls?.regular) {
      console.warn(`⚠️ No image URL found in results for: ${normalizedQuery}`);
      return {
        imageUrl: null,
        source: 'unsplash-api',
        error: 'No image URL',
      };
    }

    const imageUrl = photo.urls.regular;
    
    console.log(`✅ Found image for ${normalizedQuery} (page: ${page}, result: ${resultIndex}): ${imageUrl}`);
    
    return {
      imageUrl,
      source: 'unsplash-api',
      photographer: photo.user?.name || 'Unknown',
      attribution: photo.links?.html || null,
    };
  } catch (error) {
    console.error(`❌ Error fetching from Unsplash:`, error.message);
    return {
      imageUrl: null,
      source: 'unsplash-api',
      error: error.message,
    };
  }
};