/**
 * Products API Service
 * Handles fetching products data from the API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch homepage products
 * @returns {Promise} Products data organized by region and category
 */
export const fetchHomepageProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/homepage`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match the expected format
    // If API already returns in correct format, return as is
    if (data.data) {
      return data;
    }

    // Otherwise transform it
    const regions = Object.keys(data || {});
    return {
      data: data,
      tabs: regions.map((region) => ({
        value: region,
        label: region,
        is_loading: false,
      })),
    };
  } catch (error) {
    console.error('Error fetching homepage products:', error);
    throw error;
  }
};

/**
 * Get mock products data for development/fallback
 * @returns {Object} Mock products data
 */
export const getMockProductsData = () => {
  return {
    data: {
      'North America': {
        'Electronics': [
          {
            id: 1,
            title: 'Travel Adapter Universal',
            price: 29.99,
            image: '/images/trending/trending1.jpg',
            rating: 4.5,
            reviews: 120,
            url: '#',
            description: 'Universal travel adapter for worldwide use',
            category: 'Electronics',
          },
          {
            id: 2,
            title: 'Portable Charger 20000mAh',
            price: 39.99,
            image: '/images/trending/trending2.jpg',
            rating: 4.8,
            reviews: 256,
            url: '#',
            description: 'High-capacity portable charger for all devices',
            category: 'Electronics',
          },
          {
            id: 3,
            title: 'Noise Cancelling Headphones',
            price: 89.99,
            image: '/images/trending/trending3.jpg',
            rating: 4.7,
            reviews: 342,
            url: '#',
            description: 'Premium noise cancelling wireless headphones',
            category: 'Electronics',
          },
        ],
        'Accessories': [
          {
            id: 4,
            title: 'Travel Pillow Memory Foam',
            price: 24.99,
            image: '/images/trending/trending4.jpg',
            rating: 4.6,
            reviews: 189,
            url: '#',
            description: 'Comfortable memory foam travel pillow',
            category: 'Accessories',
          },
          {
            id: 5,
            title: 'Luggage Tag Set',
            price: 12.99,
            image: '/images/trending/trending1.jpg',
            rating: 4.4,
            reviews: 95,
            url: '#',
            description: 'Durable luggage tag set with holder',
            category: 'Accessories',
          },
          {
            id: 6,
            title: 'Travel Organizer',
            price: 19.99,
            image: '/images/trending/trending2.jpg',
            rating: 4.5,
            reviews: 178,
            url: '#',
            description: 'Multi-compartment travel organizer',
            category: 'Accessories',
          },
        ],
        'Bags & Luggage': [
          {
            id: 7,
            title: 'Carry-On Suitcase',
            price: 149.99,
            image: '/images/trending/trending3.jpg',
            rating: 4.8,
            reviews: 421,
            url: '#',
            description: 'Hard-shell carry-on suitcase with wheels',
            category: 'Bags & Luggage',
          },
          {
            id: 8,
            title: 'Travel Backpack',
            price: 79.99,
            image: '/images/trending/trending4.jpg',
            rating: 4.6,
            reviews: 267,
            url: '#',
            description: 'Spacious travel backpack with USB port',
            category: 'Bags & Luggage',
          },
        ],
      },
      'Europe': {
        'Electronics': [
          {
            id: 9,
            title: 'Compact Camera',
            price: 199.99,
            image: '/images/trending/trending1.jpg',
            rating: 4.7,
            reviews: 342,
            url: '#',
            description: 'High-quality compact travel camera',
            category: 'Electronics',
          },
          {
            id: 10,
            title: 'Action Camera',
            price: 129.99,
            image: '/images/trending/trending2.jpg',
            rating: 4.9,
            reviews: 512,
            url: '#',
            description: '4K action camera for adventures',
            category: 'Electronics',
          },
        ],
        'Accessories': [
          {
            id: 11,
            title: 'Passport Holder',
            price: 15.99,
            image: '/images/trending/trending3.jpg',
            rating: 4.5,
            reviews: 234,
            url: '#',
            description: 'RFID blocking passport holder',
            category: 'Accessories',
          },
        ],
      },
      'Asia-Pacific': {
        'Electronics': [
          {
            id: 12,
            title: 'Travel Router',
            price: 49.99,
            image: '/images/trending/trending4.jpg',
            rating: 4.6,
            reviews: 189,
            url: '#',
            description: 'Portable travel WiFi router',
            category: 'Electronics',
          },
        ],
        'Accessories': [
          {
            id: 13,
            title: 'Travel Laundry Bag',
            price: 9.99,
            image: '/images/trending/trending1.jpg',
            rating: 4.3,
            reviews: 156,
            url: '#',
            description: 'Waterproof travel laundry bag',
            category: 'Accessories',
          },
        ],
      },
    },
  };
};

export default {
  fetchHomepageProducts,
  getMockProductsData,
};

