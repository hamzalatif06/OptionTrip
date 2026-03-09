import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  fetchPostBySlug, fetchPrevPost, fetchNextPost,
  fetchComments, submitComment,
  getFeaturedImage, formatDate, getAIFallbackImage,
} from '../../services/wordpressApi';
import './BlogDetail.css';

// ─── Skeleton loader ──────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="blog-detail">
    <div className="blog-detail__container">
      <div className="blog-skeleton-line" style={{ width: '20%', height: 14, marginBottom: 24 }} />
      <div className="blog-skeleton-line" style={{ width: '80%', height: 36, marginBottom: 10 }} />
      <div className="blog-skeleton-line" style={{ width: '55%', height: 36, marginBottom: 20 }} />
      <div className="blog-skeleton-line" style={{ width: '25%', height: 14, marginBottom: 28 }} />
      <div className="blog-detail__hero-skeleton blog-skeleton-line" />
      {[100, 90, 95, 70, 85, 60].map((w, i) => (
        <div key={i} className="blog-skeleton-line" style={{ width: `${w}%`, height: 15, marginTop: 14 }} />
      ))}
    </div>
  </div>
);

// ─── Share bar ────────────────────────────────────────────────────
const ShareBar = ({ title, className = '', onShare, onCopy, onPrint, copied }) => (
  <div className={`blog-detail__share ${className}`}>
    <span className="blog-detail__share-label">Share:</span>
    <button onClick={() => onShare('twitter')} className="blog-detail__share-btn blog-detail__share-btn--twitter" title="Share on X / Twitter">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </button>
    <button onClick={() => onShare('facebook')} className="blog-detail__share-btn blog-detail__share-btn--facebook" title="Share on Facebook">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    </button>
    <button onClick={() => onShare('whatsapp')} className="blog-detail__share-btn blog-detail__share-btn--whatsapp" title="Share on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </button>
    <button onClick={() => onShare('linkedin')} className="blog-detail__share-btn blog-detail__share-btn--linkedin" title="Share on LinkedIn">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </button>
    <button onClick={onCopy} className={`blog-detail__share-btn blog-detail__share-btn--copy ${copied ? 'blog-detail__share-btn--copied' : ''}`} title={copied ? 'Copied!' : 'Copy link'}>
      {copied
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      }
    </button>
    <button onClick={onPrint} className="blog-detail__share-btn blog-detail__share-btn--print" title="Print article">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    </button>
  </div>
);

// ─── Main component ───────────────────────────────────────────────
const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);

  const [comments, setComments]               = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [form, setForm]             = useState({ name: '', email: '', content: '' });
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [submitError, setSubmitError]   = useState('');

  const [copied, setCopied] = useState(false);

  // ── Load main post ──────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        setPrevPost(null);
        setNextPost(null);
        setComments([]);
        setSubmitStatus(null);
        const res = await fetchPostBySlug(slug);
        if (!cancelled) {
          if (!res.data || res.data.length === 0) setNotFound(true);
          else setPost(res.data[0]);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load article. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Load prev/next + comments once post is available ────────────
  useEffect(() => {
    if (!post) return;
    fetchPrevPost(post.date).then(r => setPrevPost(r.data?.[0] || null)).catch(() => {});
    fetchNextPost(post.date).then(r => setNextPost(r.data?.[0] || null)).catch(() => {});
    setCommentsLoading(true);
    fetchComments(post.id)
      .then(r => setComments(r.data || []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [post]);

  // ── Auto-clear "copied" after 2 s ───────────────────────────────
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // ── Share / print helpers ────────────────────────────────────────
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleShare = (platform) => {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(post?.title?.rendered ? DOMPurify.sanitize(post.title.rendered) : '');
    const map = {
      twitter:  `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent((post?.title?.rendered || '') + ' ' + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    };
    window.open(map[platform], '_blank', 'noopener,noreferrer');
  };
  const handleCopy  = () => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true));
  const handlePrint = () => window.print();

  // ── Comment submit ───────────────────────────────────────────────
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.content.trim()) return;
    setSubmitStatus('submitting');
    setSubmitError('');
    try {
      await submitComment(post.id, form);
      setSubmitStatus('success');
      setForm({ name: '', email: '', content: '' });
      fetchComments(post.id).then(r => setComments(r.data || [])).catch(() => {});
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(err?.response?.data?.message || 'Failed to submit comment. Please try again.');
    }
  };

  // ── Loading / error states ───────────────────────────────────────
  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div className="blog-detail">
        <div className="blog-detail__container blog-detail__not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C2CAD2" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Article Not Found</h2>
          <p>The article you're looking for doesn't exist or may have been removed.</p>
          <Link to="/blog" className="blog-detail__back-btn">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-detail">
        <div className="blog-detail__container blog-detail__not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F30F89" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Something Went Wrong</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="blog-detail__back-btn" onClick={() => navigate(0)}>Try Again</button>
            <Link to="/blog" className="blog-detail__back-btn blog-detail__back-btn--outline">← Back to Blog</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────
  const wpImage    = getFeaturedImage(post, 'full') || getFeaturedImage(post, 'medium_large');
  const heroImage  = wpImage || getAIFallbackImage(post?.title?.rendered || 'travel', post?.id || 1);
  const isAIImage  = !wpImage;
  const title      = post?.title?.rendered || '';
  const content    = DOMPurify.sanitize(post?.content?.rendered || '');
  const date       = formatDate(post?.date);
  const categories = post?._embedded?.['wp:term']?.[0] || [];
  const categoryName  = categories[0]?.name || 'Travel';
  const author        = post?._embedded?.['author']?.[0]?.name || 'OptionTrip Team';
  const authorAvatar  = post?._embedded?.['author']?.[0]?.avatar_urls?.['48'] || null;
  const wordCount     = (post?.content?.rendered || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime      = Math.max(1, Math.ceil(wordCount / 200));

  const shareProp = { onShare: handleShare, onCopy: handleCopy, onPrint: handlePrint, copied };

  return (
    <div className="blog-detail">
      <div className="blog-detail__container">

      <div> {/* Back link */}
        <Link to="/blog" className="blog-detail__back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Blog
        </Link>
</div> 
        {/* Category */}
        <span className="blog-detail__category">{categoryName}</span>

        {/* Title */}
        <h1 className="blog-detail__title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }} />

        {/* Meta */}
        <div className="blog-detail__meta">
          {authorAvatar && <img src={authorAvatar} alt={author} className="blog-detail__author-avatar" />}
          <span className="blog-detail__author">{author}</span>
          <span className="blog-detail__meta-divider" />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="blog-detail__date">{date}</span>
          <span className="blog-detail__meta-divider" />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="blog-detail__read-time">{readTime} min read</span>
        </div>

        {/* Share bar — top */}
        <ShareBar {...shareProp} className="blog-detail__share--top" />

        {/* Hero image */}
        <div className="blog-detail__hero">
          <img
            src={heroImage}
            alt={title}
            className="blog-detail__hero-img"
            onError={(e) => {
              if (isAIImage) e.currentTarget.src = '/images/trending/trending10.jpg';
              else e.currentTarget.style.display = 'none';
            }}
          />
          {isAIImage && (
            <div className="blog-detail__ai-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              AI Generated
            </div>
          )}
        </div>

        {/* Article content */}
        <div className="blog-detail__content wp-content" dangerouslySetInnerHTML={{ __html: content }} />

        {/* Share bar — bottom */}
        <ShareBar {...shareProp} className="blog-detail__share--bottom" />

        {/* Prev / Next navigation */}
        {(prevPost || nextPost) && (
          <div className="blog-detail__nav">
            <div>
              {prevPost && (
                <Link to={`/blog/${prevPost.slug}`} className="blog-detail__nav-card blog-detail__nav-card--prev">
                  <span className="blog-detail__nav-label">← Previous Article</span>
                  <span className="blog-detail__nav-title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prevPost.title?.rendered || '') }} />
                </Link>
              )}
            </div>
            <div>
              {nextPost && (
                <Link to={`/blog/${nextPost.slug}`} className="blog-detail__nav-card blog-detail__nav-card--next">
                  <span className="blog-detail__nav-label">Next Article →</span>
                  <span className="blog-detail__nav-title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(nextPost.title?.rendered || '') }} />
                </Link>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Comment section ────────────────────────────────────── */}
      <div className="blog-detail__comments-wrap">
        <div className="blog-detail__container">

          <h3 className="blog-detail__comments-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Comments
            {comments.length > 0 && <span className="blog-detail__comment-count">({comments.length})</span>}
          </h3>

          {/* Existing comments */}
          {commentsLoading ? (
            <p className="blog-detail__comments-loading">Loading comments…</p>
          ) : comments.length > 0 ? (
            <div className="blog-detail__comment-list">
              {comments.map((c) => {
                const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author_name)}&size=48&background=e8f0fe&color=0A539D&bold=true`;
                return (
                  <div key={c.id} className="blog-detail__comment">
                    <img
                      src={c.author_avatar_urls?.['48'] || avatarFallback}
                      alt={c.author_name}
                      className="blog-detail__comment-avatar"
                      onError={(e) => { e.currentTarget.src = avatarFallback; }}
                    />
                    <div className="blog-detail__comment-body">
                      <div className="blog-detail__comment-header">
                        <span className="blog-detail__comment-author">{c.author_name}</span>
                        <span className="blog-detail__comment-date">{formatDate(c.date)}</span>
                      </div>
                      <div
                        className="blog-detail__comment-text"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content?.rendered || '') }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="blog-detail__no-comments">No comments yet. Be the first to share your thoughts!</p>
          )}

          {/* Comment form */}
          <div className="blog-detail__comment-form-wrap">
            <h4 className="blog-detail__comment-form-title">Leave a Comment</h4>
            {submitStatus === 'success' ? (
              <div className="blog-detail__comment-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Thank you! Your comment has been submitted and is awaiting review.
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="blog-detail__comment-form">
                <div className="blog-detail__comment-form-row">
                  <div className="blog-detail__comment-form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="blog-detail__comment-form-group">
                    <label>Email * <span>(not published)</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="blog-detail__comment-form-group">
                  <label>Comment *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Share your thoughts…"
                    rows={5}
                    required
                  />
                </div>
                {submitStatus === 'error' && (
                  <p className="blog-detail__comment-error">{submitError}</p>
                )}
                <button
                  type="submit"
                  className="blog-detail__comment-submit btn-main"
                  disabled={submitStatus === 'submitting'}
                >
                  {submitStatus === 'submitting' ? 'Submitting…' : 'Post Comment'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
