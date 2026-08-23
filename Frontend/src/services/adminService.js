import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = getAccessToken();
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
};

const get = async (path) => {
  const res = await fetch(`${API_BASE}/api/admin${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getAdminStats    = ()              => get('/stats');
export const getAdminUsers    = (page, search)  => get(`/users?page=${page}&search=${encodeURIComponent(search || '')}`);
export const getAdminActivity = (type, page)    => get(`/activity?type=${type || ''}&page=${page || 1}`);

export const deactivateUser = async (id) => {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getBlogImageOverrides = () => get('/blog-images');

export const uploadBlogImage = async (postId, file, meta = {}) => {
  const token = getAccessToken();
  const formData = new FormData();
  // postId/slug/title must be appended before the file — multer's disk
  // storage reads req.body while the file is still streaming, so fields
  // appended after it aren't populated yet.
  formData.append('postId', postId);
  if (meta.slug)  formData.append('slug', meta.slug);
  if (meta.title) formData.append('title', meta.title);
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/api/admin/blog-images`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const deleteBlogImageOverride = async (postId) => {
  const res = await fetch(`${API_BASE}/api/admin/blog-images/${postId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
