import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, getFeaturedImage, stripHtml } from '../../services/wordpressApi';
import './RecentArticles.css';

const FALLBACK_IMAGE = '/images/trending/trending10.jpg';

// Minimal shimmer skeleton matching the existing card layout
const ArticleSkeleton = () => (
  <div className="col-lg-4 col-md-6">
    <div className="trend-item box-shadow bg-white mb-4 rounded overflow-hidden">
      <div className="trend-image" style={{ background: '#f0f2f5', height: 200 }} />
      <div className="trend-content-main p-4 pb-2">
        <div className="ra-skeleton-line" style={{ width: '35%', height: 14, marginBottom: 10 }} />
        <div className="ra-skeleton-line" style={{ width: '90%', height: 18, marginBottom: 6 }} />
        <div className="ra-skeleton-line" style={{ width: '65%', height: 18, marginBottom: 12 }} />
        <div className="ra-skeleton-line" style={{ width: '100%', height: 13, marginBottom: 6 }} />
        <div className="ra-skeleton-line" style={{ width: '80%', height: 13, marginBottom: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ra-skeleton-line" style={{ width: '35%', height: 13 }} />
          <div className="ra-skeleton-line" style={{ width: '25%', height: 32, borderRadius: 50 }} />
        </div>
      </div>
    </div>
  </div>
);

const REFRESH_INTERVAL = 5 * 60 * 1000; // re-fetch every 5 minutes

const RecentArticles = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    fetchPosts(3)
      .then((res) => { setPosts(res.data || []); })
      .catch(() => { /* silent — homepage should never break */ })
      .finally(() => { setLoading(false); });
  };

  useEffect(() => {
    // Initial fetch
    loadPosts(false);

    // Poll every 5 minutes silently (no skeleton flash)
    const interval = setInterval(() => loadPosts(true), REFRESH_INTERVAL);

    // Refresh when user returns to this tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadPosts(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <section className="trending recent-articles pb-6">
      <div className="container">
        <div className="section-title mb-6 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Our Blogs Offers</h4>
          <h2 className="mb-1">Recent <span className="theme">Articles &amp; Posts</span></h2>
          <p>Stay updated with the latest travel trends, AI insights, destination guides, and expert tips to make your next trip extraordinary.</p>
        </div>

        <div className="recent-articles-inner">
          <div className="row">
            {loading
              ? [0, 1, 2].map((i) => <ArticleSkeleton key={i} />)
              : posts.map((post) => {
                  const image = getFeaturedImage(post, 'medium_large') || FALLBACK_IMAGE;
                  const title = post?.title?.rendered || '';
                  const excerpt = stripHtml(post?.excerpt?.rendered || '', 120);
                  const slug = post?.slug;
                  const categories = post?._embedded?.['wp:term']?.[0] || [];
                  const category = categories[0]?.name || 'Travel';
                  const author = post?._embedded?.['author']?.[0]?.name || 'OptionTrip';
                  const authorAvatar = post?._embedded?.['author']?.[0]?.avatar_urls?.['48'] || '/images/reviewer/1.jpg';

                  return (
                    <div key={post.id} className="col-lg-4 col-md-6">
                      <div className="trend-item box-shadow bg-white mb-4 rounded overflow-hidden">
                        <div className="trend-image">
                          <img
                            src={image}
                            alt={title}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        </div>
                        <div className="trend-content-main p-4 pb-2">
                          <div className="trend-content">
                            <h5 className="theme mb-1">{category}</h5>
                            <h4>
                              <Link to={`/blog/${slug}`} dangerouslySetInnerHTML={{ __html: title }} />
                            </h4>
                            <p className="mb-3">{excerpt}</p>
                            <div className="entry-meta d-flex align-items-center justify-content-between">
                              <div className="entry-author mb-2">
                                <img
                                  src={authorAvatar}
                                  alt={author}
                                  className="rounded-circle me-1"
                                  onError={(e) => { e.currentTarget.src = '/images/reviewer/1.jpg'; }}
                                />
                                <span>{author}</span>
                              </div>
                              <div className="entry-button d-flex align-items-center mb-2">
                                <Link to={`/blog/${slug}`} className="nir-btn">Read More</Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* View More */}
        {!loading && posts.length > 0 && (
          <div className="text-center mt-4">
            <a
              href="https://blog.optiontrip.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nir-btn"
            >
              View All Posts
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentArticles;
