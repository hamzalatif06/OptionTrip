import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchPostBySlug, getFeaturedImage, formatDate } from '../../services/wordpressApi';
import './BlogDetail.css';

// ─── Skeleton loader for the detail page ─────────────────────────
const DetailSkeleton = () => (
  <div className="blog-detail">
    <div className="blog-detail__container">
      <div className="blog-skeleton-line" style={{ width: '20%', height: 14, marginBottom: 24 }} />
      <div className="blog-skeleton-line" style={{ width: '80%', height: 36, marginBottom: 10 }} />
      <div className="blog-skeleton-line" style={{ width: '55%', height: 36, marginBottom: 20 }} />
      <div className="blog-skeleton-line" style={{ width: '25%', height: 14, marginBottom: 28 }} />
      <div className="blog-detail__hero-skeleton blog-skeleton-line" />
      {[100, 90, 95, 70, 85, 60].map((w, i) => (
        <div
          key={i}
          className="blog-skeleton-line"
          style={{ width: `${w}%`, height: 15, marginTop: 14 }}
        />
      ))}
    </div>
  </div>
);

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const res = await fetchPostBySlug(slug);

        if (!cancelled) {
          if (!res.data || res.data.length === 0) {
            setNotFound(true);
          } else {
            setPost(res.data[0]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load article. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <DetailSkeleton />;

  // ── Not found ─────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="blog-detail">
        <div className="blog-detail__container blog-detail__not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C2CAD2" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Article Not Found</h2>
          <p>The article you're looking for doesn't exist or may have been removed.</p>
          <Link to="/blog" className="blog-detail__back-btn">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="blog-detail">
        <div className="blog-detail__container blog-detail__not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F30F89" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Something Went Wrong</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="blog-detail__back-btn" onClick={() => navigate(0)}>
              Try Again
            </button>
            <Link to="/blog" className="blog-detail__back-btn blog-detail__back-btn--outline">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Post ───────────────────────────────────────────────────────
  const heroImage = getFeaturedImage(post, 'full') || getFeaturedImage(post, 'medium_large');
  const title = post?.title?.rendered || '';
  const content = DOMPurify.sanitize(post?.content?.rendered || '');
  const date = formatDate(post?.date);
  const categories = post?._embedded?.['wp:term']?.[0] || [];
  const categoryName = categories[0]?.name || 'Travel';
  const author = post?._embedded?.['author']?.[0]?.name || 'OptionTrip Team';
  const authorAvatar = post?._embedded?.['author']?.[0]?.avatar_urls?.['48'] || null;

  return (
    <div className="blog-detail">
      {/* Breadcrumb */}
      <div className="blog-detail__breadcrumb">
        <div className="container">
          <Link to="/">Home</Link>
          <span className="blog-detail__breadcrumb-sep">›</span>
          <Link to="/blog">Blog</Link>
          <span className="blog-detail__breadcrumb-sep">›</span>
          <span>{categoryName}</span>
        </div>
      </div>

      <div className="blog-detail__container">
        {/* Category tag */}
        <span className="blog-detail__category">{categoryName}</span>

        {/* Title */}
        <h1
          className="blog-detail__title"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
        />

        {/* Meta row */}
        <div className="blog-detail__meta">
          {authorAvatar && (
            <img
              src={authorAvatar}
              alt={author}
              className="blog-detail__author-avatar"
            />
          )}
          <span className="blog-detail__author">{author}</span>
          <span className="blog-detail__meta-divider" />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="blog-detail__date">{date}</span>
        </div>

        {/* Hero image */}
        {heroImage && (
          <div className="blog-detail__hero">
            <img
              src={heroImage}
              alt={title}
              className="blog-detail__hero-img"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="blog-detail__content wp-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Back link */}
        <div className="blog-detail__footer">
          <Link to="/blog" className="blog-detail__back-btn">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
