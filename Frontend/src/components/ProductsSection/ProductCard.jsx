import React from 'react';
import './ProductsSection.css';

const ProductCard = ({ product }) => {
  // Amazon affiliate tag (like TripTap)
  const AFFILIATE_TAG = 'optiontrip-20';

  // Decode HTML entities (from TripTap)
  const decodeHtmlEntities = (str) => {
    if (!str) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };

  // Add affiliate tag to Amazon URLs (from TripTap)
  const addAmazonAffiliateTag = (url) => {
    if (!url) return '#';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('amazon.com') || urlObj.hostname.includes('amazon.')) {
        urlObj.searchParams.set('tag', AFFILIATE_TAG);
        return urlObj.toString();
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const details = product?.details || {};

  // Extract data from API structure
  const title = decodeHtmlEntities(details.product_title || product.title || 'Product');
  const price = details.product_price || `$${product.price?.toFixed(2)}` || '$0.00';
  const originalPrice = details.product_original_price;
  const rating = parseFloat(details.product_star_rating || product.rating || 0);
  const reviewCount = details.product_num_ratings || product.reviews || 0;
  const imageUrl = details.product_photo || product.image || '/images/trending/trending1.jpg';
  const productUrl = addAmazonAffiliateTag(details.product_url || product.url || '#');
  const badge = details.product_badge;
  const isPrime = details.is_prime;
  const salesVolume = details.sales_volume;
  const delivery = details.delivery;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="rating-stars">
        {Array.from({ length: 5 }, (_, i) => {
          if (i < fullStars) {
            return <span key={i} className="fa fa-star checked"></span>;
          } else if (i === fullStars && hasHalfStar) {
            return <span key={i} className="fa fa-star-half-o checked"></span>;
          } else {
            return <span key={i} className="fa fa-star-o"></span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <a href={productUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={imageUrl}
            alt={title}
            className="product-image"
            onError={(e) => {
              e.target.src = '/images/trending/trending1.jpg';
            }}
          />
        </a>

        {/* Badges */}
        <div className="product-badges">
          {badge && (
            <span className="product-badge">{badge}</span>
          )}
          {isPrime && (
            <span className="prime-badge">
              <i className="fa fa-bolt"></i> Prime
            </span>
          )}
        </div>
      </div>

      <div className="product-content">
        {/* Title */}
        <h5 className="product-title">
          <a href={productUrl} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h5>

        {/* Rating */}
        {rating > 0 && (
          <div className="product-rating">
            {renderStars(rating)}
            <span className="rating-value">{rating}</span>
            {reviewCount > 0 && (
              <span className="rating-count">({reviewCount.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Sales Volume */}
        {salesVolume && (
          <div className="sales-volume">
            <i className="fa fa-shopping-cart"></i> {salesVolume}
          </div>
        )}

        {/* Price */}
        <div className="product-price">
          <span className="current-price">{price}</span>
          {originalPrice && (
            <span className="original-price">{originalPrice}</span>
          )}
        </div>

        {/* Delivery Info */}
        {delivery && (
          <div className="delivery-info">
            <i className="fa fa-truck"></i> {delivery}
          </div>
        )}

        {/* Shop Now Button */}
        <a
          href={productUrl}
          className="shop-now-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa fa-amazon"></i> Shop on Amazon
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
