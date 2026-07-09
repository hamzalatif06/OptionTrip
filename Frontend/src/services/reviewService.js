const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getReviews = async (destination, page = 1) => {
  const res = await fetch(
    `${API_BASE}/api/reviews?destination=${encodeURIComponent(destination)}&page=${page}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
};

export const createReview = async ({ destinationName, country, rating, text, tripId }, token) => {
  const res = await fetch(`${API_BASE}/api/reviews`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({ destinationName, country, rating, text, tripId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit review');
  return data;
};

export const deleteReview = async (reviewId, token) => {
  const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });
  if (!res.ok) throw new Error('Failed to delete review');
  return res.json();
};
