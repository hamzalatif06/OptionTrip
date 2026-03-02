import React from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedImage, formatDate, stripHtml } from '../../services/wordpressApi';
import './BlogCard.css';

const FALLBACK_IMAGE = '/images/trending/trending10.jpg';

const BlogCard = ({ post }) => {
  const image = getFeaturedImage(post, 'medium_large') || FALLBACK_IMAGE;
  const title = post?.title?.rendered || 'Untitled';
  const excerpt = stripHtml(post?.excerpt?.rendered || '', 130);
  const slug = post?.slug;
  const date = formatDate(post?.date);
  const categories = post?._embedded?.['wp:term']?.[0] || [];
  const categoryName = categories[0]?.name || 'Travel';

  return (
    <div className="blog-card">
      <div className="blog-card__image-wrap">
        <Link to={`/blog/${slug}`} aria-label={title}>
          <img
            src={image}
            alt={title}
            className="blog-card__image"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          />
        </Link>
        <span className="blog-card__category">{categoryName}</span>
      </div>

      <div className="blog-card__body">
        <p className="blog-card__date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {date}
        </p>

        <h3 className="blog-card__title">
          <Link to={`/blog/${slug}`}>{title}</Link>
        </h3>

        <p className="blog-card__excerpt">{excerpt}</p>

        <Link to={`/blog/${slug}`} className="blog-card__read-more">
          Read More
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;
