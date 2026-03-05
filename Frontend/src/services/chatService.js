/**
 * Chat Service
 * Handles communication with Vi AI Assistant backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

/**
 * Send a message to Vi assistant
 * @param {string} message
 * @param {string|null} token
 * @param {string|null} tripId
 * @param {string|null} conversationId
 */
export const sendMessage = async (message, token = null, tripId = null, conversationId = null) => {
  const body = { message };
  if (tripId)          body.tripId = tripId;
  if (conversationId)  body.conversationId = conversationId;

  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: authHeaders(token),
    credentials: 'include',
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to send message');
  }
  return response.json();
};

/**
 * Get list of past conversations for authenticated user
 */
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

/**
 * Load a specific conversation by ID
 */
export const getConversation = async (conversationId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
    headers: authHeaders(token),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch conversation');
  return response.json();
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
  return response.json();
};

/**
 * Get Vi assistant status
 */
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

/**
 * Legacy chat history endpoint
 */
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
