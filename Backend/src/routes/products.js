import express from 'express';
const router = express.Router();

// Mock Amazon products data with Unsplash placeholder images
// Note: Replace with real Amazon Product API when integrating
const mockProducts = {
  tabs: [
    { value: 'all', label: 'All', is_loading: false },
    { value: 'North America', label: 'North America', is_loading: false },
    { value: 'Europe', label: 'Europe', is_loading: false },
    { value: 'Asia-Pacific', label: 'Asia-Pacific', is_loading: false },
    { value: 'Caribbean', label: 'Caribbean', is_loading: false }
  ],
  data: {
    "North America": {
      "Electronics": [
        {
          asin: "B09V3HN1KC",
          details: {
            product_title: "Anker Portable Charger, 10000mAh Power Bank",
            product_price: "$21.99",
            product_original_price: "$29.99",
            product_star_rating: "4.6",
            product_num_ratings: 38247,
            product_photo: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B09V3HN1KC",
            product_badge: "Best Seller",
            is_prime: true,
            sales_volume: "50K+ bought",
            delivery: "FREE delivery Thu, Dec 26",
            currency: "USD"
          },
          region: "North America",
          category: "Electronics"
        },
        {
          asin: "B01N5IB20Q",
          details: {
            product_title: "TP-Link AC750 WiFi Travel Router",
            product_price: "$29.99",
            product_original_price: "$39.99",
            product_star_rating: "4.4",
            product_num_ratings: 12543,
            product_photo: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B01N5IB20Q",
            product_badge: "Amazon's Choice",
            is_prime: true,
            sales_volume: "10K+ bought",
            delivery: "FREE delivery Wed, Dec 25",
            currency: "USD"
          },
          region: "North America",
          category: "Electronics"
        },
        {
          asin: "B07X6C9RMF",
          details: {
            product_title: "Universal Travel Adapter, All-in-One",
            product_price: "$16.99",
            product_star_rating: "4.5",
            product_num_ratings: 8234,
            product_photo: "https://images.unsplash.com/photo-1591290619762-0a84fb2c1d8f?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B07X6C9RMF",
            is_prime: true,
            sales_volume: "20K+ bought",
            delivery: "FREE delivery Thu, Dec 26",
            currency: "USD"
          },
          region: "North America",
          category: "Electronics"
        }
      ],
      "Bags & Luggage": [
        {
          asin: "B075QP1K5H",
          details: {
            product_title: "BANGE Travel Backpack, Water Resistant Laptop Backpack",
            product_price: "$35.99",
            product_original_price: "$49.99",
            product_star_rating: "4.7",
            product_num_ratings: 15234,
            product_photo: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B075QP1K5H",
            product_badge: "Best Seller",
            is_prime: true,
            sales_volume: "30K+ bought",
            delivery: "FREE delivery Wed, Dec 25",
            currency: "USD"
          },
          region: "North America",
          category: "Bags & Luggage"
        },
        {
          asin: "B071YNKH8J",
          details: {
            product_title: "Samsonite Omni PC Hardside Expandable Luggage",
            product_price: "$129.99",
            product_original_price: "$179.99",
            product_star_rating: "4.6",
            product_num_ratings: 25678,
            product_photo: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B071YNKH8J",
            product_badge: "Amazon's Choice",
            is_prime: true,
            sales_volume: "10K+ bought",
            delivery: "FREE delivery Mon, Dec 30",
            currency: "USD"
          },
          region: "North America",
          category: "Bags & Luggage"
        }
      ],
      "Accessories": [
        {
          asin: "B09V31J2BF",
          details: {
            product_title: "Neck Pillow for Traveling, Memory Foam Travel Pillow",
            product_price: "$19.99",
            product_original_price: "$29.99",
            product_star_rating: "4.5",
            product_num_ratings: 9876,
            product_photo: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B09V31J2BF",
            product_badge: "Best Seller",
            is_prime: true,
            sales_volume: "50K+ bought",
            delivery: "FREE delivery Wed, Dec 25",
            currency: "USD"
          },
          region: "North America",
          category: "Accessories"
        },
        {
          asin: "B08T5JN4GD",
          details: {
            product_title: "Compression Packing Cubes for Travel, 6 Set",
            product_price: "$26.99",
            product_star_rating: "4.7",
            product_num_ratings: 18543,
            product_photo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop",
            product_url: "https://amazon.com/dp/B08T5JN4GD",
            is_prime: true,
            sales_volume: "40K+ bought",
            delivery: "FREE delivery Thu, Dec 26",
            currency: "USD"
          },
          region: "North America",
          category: "Accessories"
        }
      ]
    },
    "Europe": {
      "Electronics": [
        {
          asin: "B09W9TZK2N",
          details: {
            product_title: "Anker PowerCore 20100mAh Portable Charger",
            product_price: "€34.99",
            product_original_price: "€44.99",
            product_star_rating: "4.6",
            product_num_ratings: 12453,
            product_photo: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&h=500&fit=crop",
            product_url: "https://amazon.de/dp/B09W9TZK2N",
            product_badge: "Best Seller",
            is_prime: true,
            sales_volume: "20K+ bought",
            delivery: "FREE delivery",
            currency: "EUR"
          },
          region: "Europe",
          category: "Electronics"
        }
      ],
      "Bags & Luggage": [
        {
          asin: "B088DTX2WT",
          details: {
            product_title: "Travel Backpack for Men Women, 40L Flight Approved",
            product_price: "€42.99",
            product_star_rating: "4.5",
            product_num_ratings: 8234,
            product_photo: "https://images.unsplash.com/photo-1622260614927-189e99ae3d98?w=500&h=500&fit=crop",
            product_url: "https://amazon.de/dp/B088DTX2WT",
            is_prime: true,
            delivery: "FREE delivery",
            currency: "EUR"
          },
          region: "Europe",
          category: "Bags & Luggage"
        }
      ],
      "Accessories": []
    },
    "Asia-Pacific": {
      "Electronics": [],
      "Bags & Luggage": [],
      "Accessories": []
    },
    "Caribbean": {
      "Electronics": [],
      "Bags & Luggage": [],
      "Accessories": []
    }
  }
};

// GET /api/products/homepage - Get homepage Amazon products
router.get('/homepage', (req, res) => {
  try {
    // Return the mock products data
    res.json(mockProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

export default router;

