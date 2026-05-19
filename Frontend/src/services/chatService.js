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
/**
 * Sentinel error thrown when no bytes arrive within `firstByteTimeoutMs`.
 * The UI uses this to fall back to the non-streaming endpoint.
 */
export class StreamTimeoutError extends Error {
  constructor(message = 'Stream timed out') { super(message); this.name = 'StreamTimeoutError'; }
}

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
  onError,
  // First byte from the server (including the priming `:ok` SSE comment) must
  // arrive within this window — otherwise we assume a proxy is buffering and
  // give up so the UI can fall back to the non-streaming endpoint. A healthy
  // SSE backend emits the priming byte in <100ms, so 4s leaves big headroom
  // while still feeling responsive when the proxy is hostile.
  firstByteTimeoutMs = 4000,
  // Once the stream is flowing, abort if it goes completely silent for this
  // long. Heartbeats from the server (every 15s) keep this reset.
  idleTimeoutMs = 30000
}) => {
  const body = { message };
  if (tripId)         body.tripId = tripId;
  if (conversationId) body.conversationId = conversationId;

  // Internal controller — we abort it on timeout. If the caller passed a
  // signal we forward its abort to ours so both work.
  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let firstByteTimer = setTimeout(() => {
    controller.abort();
    onError?.(new StreamTimeoutError('No bytes received from streaming endpoint'));
  }, firstByteTimeoutMs);
  let idleTimer = null;
  let firstByteSeen = false;
  let finished = false;

  const armIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      controller.abort();
      if (!finished) onError?.(new StreamTimeoutError('Stream went idle'));
    }, idleTimeoutMs);
  };

  const clearTimers = () => {
    if (firstByteTimer) { clearTimeout(firstByteTimer); firstByteTimer = null; }
    if (idleTimer)      { clearTimeout(idleTimer);      idleTimer = null; }
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat/message/stream`, {
      method: 'POST',
      headers: { ...authHeaders(token), Accept: 'text/event-stream' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    clearTimers();
    if (err.name === 'AbortError' && !firstByteSeen) {
      // Aborted by our first-byte timer — the onError above already fired.
      return;
    }
    onError?.(err);
    return;
  }

  if (!response.ok || !response.body) {
    clearTimers();
    let msg = 'Failed to stream message';
    try { const err = await response.json(); msg = err.message || msg; } catch { /* noop */ }
    onError?.(new Error(msg));
    return;
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const handleEvent = (rawEvent) => {
    let eventName = 'message';
    let dataLine  = '';
    for (const line of rawEvent.split('\n')) {
      if (line.startsWith(':')) continue;          // SSE comment / heartbeat
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
      case 'done':   finished = true; onDone?.();                                 break;
      case 'error':  onError?.(new Error(payload.message || 'Stream error'));     break;
      default: break;
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // First byte received — clear the first-byte timer, arm idle timer.
      if (!firstByteSeen) {
        firstByteSeen = true;
        if (firstByteTimer) { clearTimeout(firstByteTimer); firstByteTimer = null; }
      }
      armIdleTimer();

      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (rawEvent.trim()) handleEvent(rawEvent);
      }
    }
    if (buffer.trim()) handleEvent(buffer);
  } catch (err) {
    if (err.name === 'AbortError') {
      if (!firstByteSeen) {
        // The first-byte timer already fired onError.
      } else if (!finished) {
        onDone?.();
      }
    } else {
      onError?.(err);
    }
  } finally {
    clearTimers();
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
