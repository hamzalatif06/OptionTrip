import React, { useState, useEffect } from 'react';
import { fetchPosts } from '../services/wordpressApi';
import BlogCard from '../components/BlogCard/BlogCard';
import './Blog.css';

// ─── Skeleton placeholder while loading ──────────────────────────
const BlogCardSkeleton = () => (
  <div className="blog-card blog-card--skeleton">
    <div className="blog-card__image-wrap" style={{ aspectRatio: '16/10', background: '#f0f2f5' }} />
    <div className="blog-card__body" style={{ gap: 12 }}>
      <div className="blog-skeleton-line" style={{ width: '40%', height: 12 }} />
      <div className="blog-skeleton-line" style={{ width: '90%', height: 20 }} />
      <div className="blog-skeleton-line" style={{ width: '70%', height: 20 }} />
      <div className="blog-skeleton-line" style={{ width: '100%', height: 14 }} />
      <div className="blog-skeleton-line" style={{ width: '85%', height: 14 }} />
      <div className="blog-skeleton-line" style={{ width: '60%', height: 14 }} />
      <div className="blog-skeleton-line" style={{ width: '30%', height: 13, marginTop: 8 }} />
    </div>
  </div>
);

const POSTS_PER_PAGE = 6;

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchPosts(POSTS_PER_PAGE, page);
        if (!cancelled) {
          setPosts(res.data);
          const total = parseInt(res.headers['x-wp-totalpages'] || '1', 10);
          setTotalPages(isNaN(total) ? 1 : total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load blog posts. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page]);

  return (
    <>
      {/* Hero Banner */}
      <div
        className="banner pt-10 pb-0 overflow-hidden"
        style={{ backgroundImage: 'url(/images/testimonial.png)' }}
      >
        <div className="container">
          <div className="banner-in">
            <div className="row align-items-center">
              <div className="col-lg-12 mb-4">
                <div className="banner-content text-center">
                  <h4 className="theme mb-0">Our Blog</h4>
                  <h1>Latest Travel Articles &amp; Posts</h1>
                  <p className="mb-4">Read our latest travel tips, guides, and stories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <section className="blog-listing-section">
        <div className="container">
          <div className="section-title mb-6 w-75 mx-auto text-center">
            <h4 className="mb-1 theme1">Our Blogs Offers</h4>
            <h2 className="mb-1">
              Recent <span className="theme">Articles &amp; Posts</span>
            </h2>
            <p>
              Stay updated with the latest travel trends, AI insights, destination
              guides, and expert tips to make your next trip extraordinary.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="blog-error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F30F89" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{error}</p>
              <button className="blog-retry-btn" onClick={() => setPage(1)}>
                Try Again
              </button>
            </div>
          )}

          {/* Grid */}
          {!error && (
            <div className="blog-grid">
              {loading
                ? Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
                    <BlogCardSkeleton key={i} />
                  ))
                : posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="blog-pagination">
              <button
                className="blog-page-btn"
                disabled={page === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                ← Previous
              </button>
              <span className="blog-page-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="blog-page-btn"
                disabled={page === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Blog;
