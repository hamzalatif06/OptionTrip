import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const shareTravelMap = async () => {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE}/api/travel-map/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
  return resp.json();
};

export const getPublicTravelMap = async (shareToken) => {
  const resp = await fetch(`${API_BASE}/api/travel-map/${shareToken}`);
  return resp.json();
};

export default { shareTravelMap, getPublicTravelMap };
