const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const sendMessage = async (
  message,
  token = null,
  tripId = null,
  conversationId = null,
  signal = undefined,
  location = null
) => {
  const body = { message };
  if (tripId)          body.tripId = tripId;
  if (conversationId)  body.conversationId = conversationId;
  if (location && (location.city || location.label || (typeof location.lat === 'number' && typeof location.lng === 'number'))) {
    body.location = location;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    let err = {};
    try { err = await response.json(); } catch {}
    throw new Error(err.message || `Failed to send message (HTTP ${response.status})`);
  }
  return response.json();
};

export const getConversations = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      headers: authHeaders(token),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  } catch (error) {
    console.error('getConversations error:', error);
    return { success: true, data: { conversations: [] } };
  }
};

export const getConversation = async (conversationId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
    headers: authHeaders(token),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch conversation');
  return response.json();
};

export const deleteConversation = async (conversationId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
  return response.json();
};

export const getViStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/status`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to get Vi status');
    return response.json();
  } catch {
    return { success: true, data: { status: 'online', name: 'Vi' } };
  }
};

export const getChatHistory = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
      headers: authHeaders(token),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to get chat history');
    return response.json();
  } catch {
    return { success: true, data: { messages: [] } };
  }
};

export default { sendMessage, getConversations, getConversation, deleteConversation, getViStatus, getChatHistory };
