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
 * Send a message to Vi assistant (non-streaming, kept as fallback).
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
 * Stream Vi's reply via Server-Sent Events.
 *
 * @param {Object}   args
 * @param {string}   args.message
 * @param {string?}  args.token
 * @param {string?}  args.tripId
 * @param {string?}  args.conversationId
 * @param {AbortSignal?} args.signal      — abort to stop the stream (used by "Stop generating")
 * @param {Function} args.onMeta          — ({ conversationId })
 * @param {Function} args.onChunk         — (text)  for every streamed token
 * @param {Function} args.onFinal         — ({ text, quickReplies, type }) authoritative reply
 * @param {Function} args.onDone          — stream complete
 * @param {Function} args.onError         — (err)
 *
 * Resolves once the stream finishes (or rejects on connection error).
 */
export const streamMessage = async ({
  message,
  token = null,
  tripId = null,
  conversationId = null,
  signal,
  onMeta,
  onChunk,
  onFinal,
  onDone,
  onError
}) => {
  const body = { message };
  if (tripId)         body.tripId = tripId;
  if (conversationId) body.conversationId = conversationId;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat/message/stream`, {
      method: 'POST',
      headers: { ...authHeaders(token), Accept: 'text/event-stream' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal
    });
  } catch (err) {
    onError?.(err);
    return;
  }

  if (!response.ok || !response.body) {
    let msg = 'Failed to stream message';
    try { const err = await response.json(); msg = err.message || msg; } catch { /* noop */ }
    onError?.(new Error(msg));
    return;
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const handleEvent = (rawEvent) => {
    // Parse SSE block:
    //   event: <name>
    //   data: <json>
    let eventName = 'message';
    let dataLine  = '';
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
    }
    if (!dataLine) return;
    let payload;
    try { payload = JSON.parse(dataLine); } catch { return; }

    switch (eventName) {
      case 'meta':   onMeta?.(payload);                                           break;
      case 'chunk':  if (payload.text) onChunk?.(payload.text);                   break;
      case 'final':  onFinal?.(payload);                                          break;
      case 'done':   onDone?.();                                                  break;
      case 'error':  onError?.(new Error(payload.message || 'Stream error'));     break;
      default: break;
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double newlines
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (rawEvent.trim()) handleEvent(rawEvent);
      }
    }
    // Flush any trailing event
    if (buffer.trim()) handleEvent(buffer);
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.();
    } else {
      onError?.(err);
    }
  }
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

export default { sendMessage, streamMessage, getConversations, getConversation, deleteConversation, getViStatus, getChatHistory };
