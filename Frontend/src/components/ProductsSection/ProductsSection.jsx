import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import { fetchHomepageProducts, getMockProductsData } from '../../services/productsService';
import './ProductsSection.css';

const ProductsSection = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('North America');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products data
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Try to fetch from API
        const data = await fetchHomepageProducts();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
        // Fallback to mock data for development
        setProducts(getMockProductsData());
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Get available regions from products data
  const regions = useMemo(() => {
    if (!products?.data) return [];
    return Object.keys(products.data);
  }, [products]);

  // Transform data for selected region
  const regionData = useMemo(() => {
    if (!products?.data || !selectedRegion) return { categories: [], items: [] };
    
    const regionProducts = products.data[selectedRegion] || {};
    const categories = Object.keys(regionProducts);
    
    const items = [];
    categories.forEach(category => {
      const categoryItems = regionProducts[category] || [];
      categoryItems.forEach(item => {
        items.push({
          ...item,
          region: selectedRegion,
          category: category,
        });
      });
    });

    return {
      categories,
      items,
    };
  }, [products, selectedRegion]);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return regionData.items;
    }
    return regionData.items.filter(item => item.category === selectedCategory);
  }, [regionData, selectedCategory]);

  // Don't render if no data
  if (!products?.data || Object.keys(products.data).length === 0) {
    return null;
  }

  return (
    <section className="products-section pt-6 pb-4" style={{backgroundImage: `url(/images/shape2.png)`}}>
      <div className="container">
        {/* Header */}
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
            <i className="icon-bag theme fs-1"></i>
            <h2 className="mb-0">Curated Travel Essentials</h2>
          </div>
          <p>Discover the perfect travel products and accessories for your next adventure</p>
        </div>

        {/* Region Tabs */}
        {regions.length > 0 && (
          <div className="products-tabs-wrapper mb-5">
            <div className="tabs-nav d-flex flex-wrap justify-content-center gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={`tab-btn ${selectedRegion === region ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRegion(region);
                    setSelectedCategory('all'); // Reset category when region changes
                  }}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        {regionData.categories.length > 0 && (
          <div className="products-category-tabs mb-5">
            <div className="tabs-nav d-flex flex-wrap justify-content-center gap-2">
              <button
                type="button"
                className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {regionData.categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`tab-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid/Carousel */}
        {isLoading ? (
          <div className="row">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div className="product-card-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <p className="text-danger">Error loading products: {error}</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="row item-slider">
            {filteredItems.map((item, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p>No products found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};


export default ProductsSection;

