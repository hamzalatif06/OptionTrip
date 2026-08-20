import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authedFetch = async (path, options = {}) => {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  return resp.json();
};

export const getMemory = () => authedFetch('/api/memory');

export const updateMemory = (facts) =>
  authedFetch('/api/memory', { method: 'PATCH', body: JSON.stringify({ facts }) });

export const forgetMemory = () =>
  authedFetch('/api/memory', { method: 'DELETE' });

export default { getMemory, updateMemory, forgetMemory };
