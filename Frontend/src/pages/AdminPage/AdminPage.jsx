import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAdminStats, getAdminUsers, getAdminActivity, deactivateUser,
  getBlogImageOverrides, uploadBlogImage, deleteBlogImageOverride
} from '../../services/adminService';
import { fetchPosts, getFeaturedImage, invalidateImageOverridesCache } from '../../services/wordpressApi';
import PageMeta from '../../hooks/usePageMeta';
import './AdminPage.css';

const ACTIVITY_TYPES = ['', 'trip', 'flight', 'hotel', 'car', 'esim', 'tours', 'chat', 'plan_my_day', 'destination', 'page'];
const BLOG_FALLBACK_IMAGE = '/images/trending/trending10.jpg';
const BLOG_POSTS_PER_PAGE = 9;

const StatCard = ({ label, value, sub }) => (
  <div className="adm-stat">
    <div className="adm-stat__value">{value ?? '—'}</div>
    <div className="adm-stat__label">{label}</div>
    {sub && <div className="adm-stat__sub">{sub}</div>}
  </div>
);

const BlogImageCard = ({ post, override, uploading, onUpload, onRevert }) => {
  const fileInputRef = useRef(null);
  const title = post?.title?.rendered || 'Untitled';
  const image = override?.imageUrl || getFeaturedImage(post, 'medium') || BLOG_FALLBACK_IMAGE;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(post, file);
    e.target.value = '';
  };

  return (
    <div className="adm-blog-card">
      <div className="adm-blog-card__img-wrap">
        <img src={image} alt={title} className="adm-blog-card__img" onError={(e) => { e.currentTarget.src = BLOG_FALLBACK_IMAGE; }} />
        {override && <span className="adm-blog-card__badge">Custom image</span>}
        {uploading && <div className="adm-blog-card__overlay">Uploading…</div>}
      </div>
      <div className="adm-blog-card__body">
        <p className="adm-blog-card__title" dangerouslySetInnerHTML={{ __html: title }} />
        <div className="adm-blog-card__actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button className="adm-blog-card__btn" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {override ? 'Change Image' : 'Upload Image'}
          </button>
          {override && (
            <button className="adm-blog-card__btn adm-blog-card__btn--revert" disabled={uploading} onClick={() => onRevert(post)}>
              Revert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  const [tab, setTab] = useState('stats');

  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [users, setUsers]           = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage]   = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [activities, setActivities]     = useState([]);
  const [actTotal, setActTotal]         = useState(0);
  const [actPage, setActPage]           = useState(1);
  const [actPages, setActPages]         = useState(1);
  const [actType, setActType]           = useState('');
  const [actLoading, setActLoading]     = useState(false);

  const [blogPosts, setBlogPosts]       = useState([]);
  const [blogOverrides, setBlogOverrides] = useState({});
  const [blogPage, setBlogPage]         = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);
  const [blogLoading, setBlogLoading]   = useState(false);
  const [blogError, setBlogError]       = useState('');
  const [uploadingId, setUploadingId]   = useState(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (tab !== 'stats') return;
    setStatsLoading(true);
    getAdminStats()
      .then(d => setStats(d.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [tab]);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    getAdminUsers(usersPage, userSearch)
      .then(d => {
        setUsers(d.data.users || []);
        setUsersTotal(d.data.total || 0);
        setUsersPages(d.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [usersPage, userSearch]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, usersPage, userSearch, loadUsers]);

  const loadActivity = useCallback(() => {
    setActLoading(true);
    getAdminActivity(actType, actPage)
      .then(d => {
        setActivities(d.data.activities || []);
        setActTotal(d.data.total || 0);
        setActPages(d.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setActLoading(false));
  }, [actType, actPage]);

  useEffect(() => { if (tab === 'activity') loadActivity(); }, [tab, actType, actPage, loadActivity]);

  const loadBlogImages = useCallback(() => {
    setBlogLoading(true);
    setBlogError('');
    Promise.all([
      fetchPosts(BLOG_POSTS_PER_PAGE, blogPage),
      getBlogImageOverrides()
    ])
      .then(([postsRes, overridesRes]) => {
        setBlogPosts(postsRes.data || []);
        const total = parseInt(postsRes.headers['x-wp-totalpages'] || '1', 10);
        setBlogTotalPages(isNaN(total) ? 1 : total);
        const map = Object.fromEntries(
          (overridesRes.data?.overrides || []).map(o => [o.postId, o])
        );
        setBlogOverrides(map);
      })
      .catch(() => setBlogError('Failed to load blog posts.'))
      .finally(() => setBlogLoading(false));
  }, [blogPage]);

  useEffect(() => { if (tab === 'blog') loadBlogImages(); }, [tab, blogPage, loadBlogImages]);

  const handleBlogImageUpload = async (post, file) => {
    setUploadingId(post.id);
    try {
      const res = await uploadBlogImage(post.id, file, {
        slug: post.slug,
        title: post.title?.rendered || ''
      });
      setBlogOverrides(prev => ({ ...prev, [post.id]: res.data.override }));
      invalidateImageOverridesCache();
    } catch (err) {
      window.alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingId(null);
    }
  };

  const handleBlogImageRevert = async (post) => {
    if (!window.confirm('Revert to the original image for this post?')) return;
    setUploadingId(post.id);
    try {
      await deleteBlogImageOverride(post.id);
      setBlogOverrides(prev => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
      invalidateImageOverridesCache();
    } catch (err) {
      window.alert(err.message || 'Failed to revert image');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await deactivateUser(id);
      loadUsers();
    } catch {}
  };

  if (loading || !user) return null;
  if (user.role !== 'admin') return null;

  return (
    <div className="adm-page">
      <PageMeta title="Admin" description="OptionTrip admin panel." path="/admin" noIndex />
      <header className="adm-header">
        <h1 className="adm-header__title">Admin Panel</h1>
        <button className="adm-header__back" onClick={() => navigate('/')}>← Back to site</button>
      </header>

      <nav className="adm-tabs">
        {[['stats', 'Stats'], ['users', 'Users'], ['activity', 'Activity'], ['blog', 'Blog Images']].map(([t, label]) => (
          <button
            key={t}
            className={`adm-tab${tab === t ? ' adm-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="adm-main">


        {tab === 'stats' && (
          <div className="adm-stats-section">
            {statsLoading ? (
              <p className="adm-loading">Loading…</p>
            ) : stats ? (
              <>
                <div className="adm-stats-grid">
                  <StatCard label="Total Users"     value={stats.totalUsers} />
                  <StatCard label="Total Trips"     value={stats.totalTrips} />
                  <StatCard label="Booking Clicks"  value={stats.bookingClicks} sub="Last 7 days" />
                  <StatCard label="Active Users"    value={stats.activeUsers}   sub="Last 7 days" />
                </div>
                {stats.topDestinations?.length > 0 && (
                  <div className="adm-top-dest">
                    <h3 className="adm-section-title">Top Destinations</h3>
                    <div className="adm-dest-list">
                      {stats.topDestinations.map((d, i) => (
                        <div key={d.name} className="adm-dest-row">
                          <span className="adm-dest-rank">#{i + 1}</span>
                          <span className="adm-dest-name">{d.name}</span>
                          <span className="adm-dest-count">{d.count} trips</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p className="adm-loading">No data</p>}
          </div>
        )}


        {tab === 'users' && (
          <div className="adm-users-section">
            <div className="adm-toolbar">
              <input
                className="adm-search"
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUsersPage(1); }}
              />
              <span className="adm-total">{usersTotal} users</span>
            </div>
            {usersLoading ? <p className="adm-loading">Loading…</p> : (
              <>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Name</th><th>Email</th><th>Role</th>
                        <th>Trips</th><th>Joined</th><th>Last Login</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className={!u.isActive ? 'adm-row--inactive' : ''}>
                          <td>{u.name}</td>
                          <td className="adm-cell--email">{u.email}</td>
                          <td><span className={`adm-badge adm-badge--${u.role}`}>{u.role}</span></td>
                          <td>{u.tripCount}</td>
                          <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                          <td>{u.lastLogin  ? new Date(u.lastLogin).toLocaleDateString()  : '—'}</td>
                          <td>
                            {u.isActive && u.role !== 'admin' && (
                              <button className="adm-deactivate-btn" onClick={() => handleDeactivate(u._id, u.name)}>
                                Deactivate
                              </button>
                            )}
                            {!u.isActive && <span className="adm-inactive-label">Inactive</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="adm-pagination">
                  <button disabled={usersPage <= 1} onClick={() => setUsersPage(p => p - 1)}>← Prev</button>
                  <span>Page {usersPage} of {usersPages}</span>
                  <button disabled={usersPage >= usersPages} onClick={() => setUsersPage(p => p + 1)}>Next →</button>
                </div>
              </>
            )}
          </div>
        )}


        {tab === 'activity' && (
          <div className="adm-activity-section">
            <div className="adm-toolbar">
              <select className="adm-select" value={actType} onChange={e => { setActType(e.target.value); setActPage(1); }}>
                {ACTIVITY_TYPES.map(t => (
                  <option key={t} value={t}>{t || 'All types'}</option>
                ))}
              </select>
              <span className="adm-total">{actTotal} events</span>
            </div>
            {actLoading ? <p className="adm-loading">Loading…</p> : (
              <>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Time</th><th>User</th><th>Type</th><th>Action</th><th>Title</th></tr>
                    </thead>
                    <tbody>
                      {activities.map(a => (
                        <tr key={a._id}>
                          <td className="adm-cell--time">{new Date(a.createdAt).toLocaleString()}</td>
                          <td>{a.user_id?.name || '—'}<br/><small>{a.user_id?.email || ''}</small></td>
                          <td><span className={`adm-badge adm-badge--type adm-badge--${a.type}`}>{a.type}</span></td>
                          <td>{a.action}</td>
                          <td className="adm-cell--title">{a.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="adm-pagination">
                  <button disabled={actPage <= 1} onClick={() => setActPage(p => p - 1)}>← Prev</button>
                  <span>Page {actPage} of {actPages}</span>
                  <button disabled={actPage >= actPages} onClick={() => setActPage(p => p + 1)}>Next →</button>
                </div>
              </>
            )}
          </div>
        )}


        {tab === 'blog' && (
          <div className="adm-blog-section">
            <p className="adm-blog-hint">
              Upload a picture to replace a post's image on OptionTrip. Posts without a custom image keep showing what's on the blog.
            </p>
            {blogError && <p className="adm-blog-error">{blogError}</p>}
            {blogLoading ? <p className="adm-loading">Loading…</p> : (
              <>
                <div className="adm-blog-grid">
                  {blogPosts.map(post => (
                    <BlogImageCard
                      key={post.id}
                      post={post}
                      override={blogOverrides[post.id]}
                      uploading={uploadingId === post.id}
                      onUpload={handleBlogImageUpload}
                      onRevert={handleBlogImageRevert}
                    />
                  ))}
                </div>
                {blogTotalPages > 1 && (
                  <div className="adm-pagination">
                    <button disabled={blogPage <= 1} onClick={() => setBlogPage(p => p - 1)}>← Prev</button>
                    <span>Page {blogPage} of {blogTotalPages}</span>
                    <button disabled={blogPage >= blogTotalPages} onClick={() => setBlogPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
