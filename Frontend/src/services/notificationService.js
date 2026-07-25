/**
 * Notification Service (client)
 *
 * Backs the notification bell in the Header. Never throws — callers get
 * null/empty on failure so a flaky request never breaks the UI.
 */

import { getAccessToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authedFetch = async (path, options = {}) => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const resp = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`notificationService ${path} failed:`, err?.message);
    }
    return null;
  }
};

/** @param {{status?: string, limit?: number}} [opts] */
export const getNotifications = async (opts = {}) => {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const json = await authedFetch(`/api/notifications${qs ? `?${qs}` : ''}`);
  return json?.data?.notifications || [];
};

export const getUnreadCount = async () => {
  const json = await authedFetch('/api/notifications/unread-count');
  return json?.data?.count ?? 0;
};

export const markRead = async (id) => {
  const json = await authedFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  return json?.success ?? false;
};

export const markAllRead = async () => {
  const json = await authedFetch('/api/notifications/read-all', { method: 'POST' });
  return json?.success ?? false;
};

export const dismiss = async (id) => {
  const json = await authedFetch(`/api/notifications/${id}/dismiss`, { method: 'PATCH' });
  return json?.success ?? false;
};

export default { getNotifications, getUnreadCount, markRead, markAllRead, dismiss };
