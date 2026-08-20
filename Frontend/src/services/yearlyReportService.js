import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getYearlyReport = async (year) => {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE}/api/yearly-report/${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.json();
};

export const getYearlyReportCardSvg = async (year) => {
  const token = getAccessToken();
  const resp = await fetch(`${API_BASE}/api/yearly-report/${year}/card.svg`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) return null;
  return resp.text();
};

export default { getYearlyReport, getYearlyReportCardSvg };
