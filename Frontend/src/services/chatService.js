/**
 * Chat Service
 * Handles communication with Vi AI Assistant backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Send a message to Vi assistant
 * @param {string} message - User's message
 * @param {string} token - Optional auth token
 * @param {string} tripId - Optional specific trip context
 * @returns {Promise<Object>} AI response
 */
export const sendMessage = async (message, token = null, tripId = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = { message };
    if (tripId) {
      body.tripId = tripId;
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
};

/**
 * Get Vi assistant status
 * @returns {Promise<Object>} Status information
 */
export const getViStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get Vi status');
    }

    return await response.json();
  } catch (error) {
    console.error('Vi status error:', error);
    // Return default status on error
    return {
      success: true,
      data: {
        status: 'online',
        name: 'Vi'
      }
    };
  }
};

/**
 * Get chat history (for authenticated users)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Chat history
 */
export const getChatHistory = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get chat history');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat history error:', error);
    return { success: true, data: { messages: [] } };
  }
};

export default {
  sendMessage,
  getViStatus,
  getChatHistory
};
