import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import { getMyTrips } from '../../services/tripsService';
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation
} from '../../services/chatService';
import './ViAssistant.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Lightweight markdown renderer — supports headings, bold, italic, inline code,
 * links, bullet/numbered lists, and paragraphs. Intentionally minimal: we
 * sanitize input by escaping HTML first, then apply inline replacements.
 */
const renderMarkdown = (raw) => {
  if (!raw) return '';
  const text = escapeHtml(raw);

  const lines = text.split('\n');
  const out = [];
  let inList = null; // 'ul' | 'ol' | null

  const closeList = () => {
    if (inList) { out.push(`</${inList}>`); inList = null; }
  };

  const inline = (s) =>
    s
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic: *text* (avoid matching ** by negative lookahead handled above)
      .replace(/(?:^|\s)\*([^*\s][^*]*?)\*(?=\s|$|[.,!?;:])/g, (m, p1) => m.replace(`*${p1}*`, `<em>${p1}</em>`))
      // Links: [label](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
      );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      closeList();
      const level = h[1].length + 2; // H3+
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    // Bullet list
    if (/^\s*[-*•]\s+/.test(line)) {
      if (inList !== 'ul') { closeList(); out.push('<ul>'); inList = 'ul'; }
      out.push(`<li>${inline(line.replace(/^\s*[-*•]\s+/, ''))}</li>`);
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== 'ol') { closeList(); out.push('<ol>'); inList = 'ol'; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }

    // Blank line — paragraph break
    if (!line.trim()) {
      closeList();
      out.push('');
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
};

// ─── Suggested prompt starters (richer empty state) ─────────────────────────

const PROMPT_STARTERS = {
  before: [
    { icon: 'fa-suitcase', label: 'Build me a packing list', text: 'Build me a packing list for my upcoming trip' },
    { icon: 'fa-bowl-food', label: 'Best places to eat', text: 'What are the best places to eat at my destination?' },
    { icon: 'fa-landmark', label: 'Must-see experiences', text: 'What are the must-see experiences I should book in advance?' },
    { icon: 'fa-passport', label: 'Visa & documents', text: 'What documents and visa do I need for this trip?' },
    { icon: 'fa-money-bill-wave', label: 'Daily budget estimate', text: 'Estimate a realistic daily budget for my trip' },
    { icon: 'fa-cloud-sun', label: 'Weather & what to wear', text: 'What is the weather like, and what should I pack to wear?' }
  ],
  during: [
    { icon: 'fa-location-dot', label: 'Nearby right now', text: 'What is worth seeing near me right now?' },
    { icon: 'fa-utensils', label: 'Dinner tonight', text: 'Suggest a great dinner spot near my hotel tonight' },
    { icon: 'fa-bus', label: 'How to get around', text: 'What is the best way to get around the city?' },
    { icon: 'fa-triangle-exclamation', label: 'I need help', text: 'I need help — what should I do?' },
    { icon: 'fa-mug-hot', label: 'Best cafés to work', text: 'Find me good cafés to work from with WiFi' },
    { icon: 'fa-camera', label: 'Photo spots', text: 'Where are the best photo spots nearby?' }
  ],
  after: [
    { icon: 'fa-plane-departure', label: 'Plan my next trip', text: 'Help me plan my next adventure based on this one' },
    { icon: 'fa-images', label: 'Trip recap', text: 'Help me write a recap of my trip' },
    { icon: 'fa-star', label: 'Recommend somewhere new', text: 'Recommend a destination I would love based on my last trip' }
  ],
  planning: [
    { icon: 'fa-wand-magic-sparkles', label: 'Plan a perfect weekend', text: 'Plan a perfect 3-day weekend escape for me' },
    { icon: 'fa-heart', label: 'Romantic getaway', text: 'Suggest a romantic getaway for two' },
    { icon: 'fa-mountain-sun', label: 'Adventure trip', text: 'Plan an adventure trip with hiking and great food' },
    { icon: 'fa-umbrella-beach', label: 'Beach vacation', text: 'Recommend a beach destination for next month' },
    { icon: 'fa-piggy-bank', label: 'Budget Europe', text: 'Plan a budget-friendly 7-day Europe trip' },
    { icon: 'fa-utensils', label: 'Food-focused trip', text: 'Plan a trip focused on amazing food and local culture' }
  ],
  guest: [
    { icon: 'fa-globe', label: 'Where should I go?', text: 'Where should I travel next? Help me decide.' },
    { icon: 'fa-suitcase-rolling', label: 'How to plan a trip', text: 'How do I plan a great trip from scratch?' },
    { icon: 'fa-money-bill-wave', label: 'Budget travel tips', text: 'Give me your best budget travel tips' },
    { icon: 'fa-passport', label: 'First international trip', text: 'I am planning my first international trip — what should I know?' }
  ]
};

// ─── Component ──────────────────────────────────────────────────────────────

const ViAssistant = () => {
  useTranslation();
  const { isAuthenticated, user } = useAuth();

  // Chat state
  const [isOpen, setIsOpen]               = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [messages, setMessages]           = useState([]);
  const [inputMessage, setInputMessage]   = useState('');
  const [isTyping, setIsTyping]           = useState(false); // request in flight
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Trip context
  const [userTrips, setUserTrips]         = useState([]);
  const [currentTrip, setCurrentTrip]     = useState(null);
  const [tripPhase, setTripPhase]         = useState('before');
  const [showTripPicker, setShowTripPicker] = useState(false);

  // Conversation persistence
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations]               = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]               = useState(false);

  // Voice state
  const [isRecording, setIsRecording]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isVoiceMode, setIsVoiceMode]   = useState(false);
  const [voiceStatus, setVoiceStatus]   = useState('');
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [speechError, setSpeechError]   = useState('');

  // Refs
  const messagesEndRef    = useRef(null);
  const messagesListRef   = useRef(null);
  const inputRef          = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const audioRef          = useRef(null);
  const stopTimeoutRef    = useRef(null);
  const requestAbortRef   = useRef(null);
  const tripPickerRef     = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastUserMessageRef  = useRef('');

  // ── Trips ──────────────────────────────────────────────────────────────

  useEffect(() => { if (isAuthenticated && isOpen) loadUserTrips(); }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (currentTrip?.dates) {
      const today = new Date();
      const start = new Date(currentTrip.dates.start_date);
      const end   = new Date(currentTrip.dates.end_date);
      setTripPhase(today < start ? 'before' : today <= end ? 'during' : 'after');
    } else {
      setTripPhase('planning');
    }
  }, [currentTrip]);

  const loadUserTrips = async () => {
    try {
      const token    = getAccessToken();
      const response = await getMyTrips(token);
      if (response.success && response.data?.trips) {
        setUserTrips(response.data.trips);
        const now = new Date();
        const upcoming = response.data.trips.find(t => new Date(t.dates?.end_date) >= now);
        setCurrentTrip(prev => prev || upcoming || response.data.trips[0] || null);
      }
    } catch (err) {
      console.error('Error loading user trips:', err);
    }
  };

  // Close trip picker on outside click
  useEffect(() => {
    if (!showTripPicker) return;
    const handler = (e) => {
      if (tripPickerRef.current && !tripPickerRef.current.contains(e.target)) {
        setShowTripPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTripPicker]);

  // ── Conversations ──────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingConversations(true);
      const token    = getAccessToken();
      const response = await getConversations(token);
      if (response.success) setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return;
    if (isAuthenticated) loadConversations();
    else if (messages.length === 0) setMessages([makeWelcomeMessage()]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (conversations.length > 0 && messages.length === 0 && !activeConversationId) {
      loadConversationMessages(conversations[0].conversation_id);
    } else if (conversations.length === 0 && messages.length === 0) {
      setMessages([makeWelcomeMessage()]);
    }
  }, [conversations, isOpen, isAuthenticated]);

  const loadConversationMessages = async (convId) => {
    try {
      const token    = getAccessToken();
      const response = await getConversation(convId, token);
      if (response.success) {
        const msgs = response.data.messages.map((m, i) => ({
          id: `${convId}-${i}`,
          text: m.text,
          sender: m.role === 'assistant' ? 'bot' : 'user',
          timestamp: new Date(m.timestamp),
          type: m.type,
          quickReplies: m.quickReplies?.length > 0 ? m.quickReplies : undefined
        }));
        setMessages(msgs.length > 0 ? msgs : [makeWelcomeMessage()]);
        setActiveConversationId(convId);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setMessages([makeWelcomeMessage()]);
    }
  };

  const handleSelectConversation = (convId) => {
    if (convId === activeConversationId) return;
    cancelRequest();
    setMessages([]);
    loadConversationMessages(convId);
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
    cancelRequest();
    setMessages([makeWelcomeMessage()]);
    setActiveConversationId(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      const token = getAccessToken();
      await deleteConversation(convId, token);
      setConversations(prev => prev.filter(c => c.conversation_id !== convId));
      if (activeConversationId === convId) {
        setMessages([makeWelcomeMessage()]);
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // ── Welcome message ────────────────────────────────────────────────────

  const makeWelcomeMessage = () => {
    let text = '';
    if (isAuthenticated && user) {
      const firstName = user.name?.split(' ')[0] || 'there';
      text = `Hi ${firstName}! 👋 I'm **Vi**, your AI travel concierge. `;
      if (currentTrip) {
        const dest = currentTrip.destination?.name || 'your destination';
        if (tripPhase === 'before') text += `I see your upcoming trip to **${dest}** — I can help you prep, build a packing list, line up must-do experiences, or refine your itinerary day-by-day.`;
        else if (tripPhase === 'during') text += `Hope you're enjoying **${dest}**! I can help with nearby spots, directions, dinner picks, or anything that comes up on the ground.`;
        else text += `How was **${dest}**? I can help you plan what's next, or capture memories from your trip.`;
      } else {
        text += `Tell me what you're thinking — a beach getaway, a city break, a road trip — and I'll help you shape it.`;
      }
    } else {
      text = `Hi! 👋 I'm **Vi**, your AI travel concierge. Ask me anything about destinations, packing, or trip planning — and sign in to save trips and unlock personalized help.`;
    }
    return { id: 'welcome', text, sender: 'bot', timestamp: new Date(), type: 'welcome', isWelcome: true };
  };

  // ── Auto-scroll (only if user is near bottom) ──────────────────────────

  const handleMessagesScroll = () => {
    const el = messagesListRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distFromBottom < 80;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // ── Send / cancel ──────────────────────────────────────────────────────

  const cancelRequest = () => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
      requestAbortRef.current = null;
    }
    setIsTyping(false);
  };

  /**
   * Send a message to Vi via the non-streaming endpoint and update the chat
   * bubble with the reply. AbortController lets the "Stop" button cancel an
   * in-flight request.
   */
  const dispatchMessage = async (userText) => {
    cancelRequest();
    lastUserMessageRef.current = userText;
    shouldAutoScrollRef.current = true;

    const userMsgId = `u-${Date.now()}`;

    setMessages(prev => {
      const stripped = prev.filter(m => !m.isWelcome);
      return [
        ...stripped,
        { id: userMsgId, text: userText, sender: 'user', timestamp: new Date() }
      ];
    });

    setIsTyping(true);
    const controller = new AbortController();
    requestAbortRef.current = controller;
    const token = isAuthenticated ? getAccessToken() : null;

    try {
      const resp = await sendMessage(
        userText,
        token,
        currentTrip?.trip_id,
        activeConversationId,
        controller.signal
      );

      if (!resp?.success || !resp.data) {
        throw new Error(resp?.message || 'Empty response from Vi');
      }

      const { message, type, quickReplies, conversationId } = resp.data;
      if (conversationId && conversationId !== activeConversationId) {
        setActiveConversationId(conversationId);
      }

      const botMsg = {
        id: `b-${Date.now()}`,
        text: message,
        sender: 'bot',
        timestamp: new Date(),
        type: type || 'general',
        quickReplies: quickReplies?.length ? quickReplies : undefined
      };
      setMessages(prev => [...prev, botMsg]);

      // Refresh the conversation list so the sidebar title/timestamp update.
      if (isAuthenticated) {
        try {
          const listResp = await getConversations(token);
          if (listResp.success) setConversations(listResp.data.conversations || []);
        } catch { /* noop */ }
      }

      if (isVoiceMode && message) await speakText(message, botMsg.id);
    } catch (err) {
      // User-initiated cancel — silent.
      if (err?.name === 'AbortError') return;

      console.error('Vi send error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          text: `I'm having trouble reaching the server right now. Please try again in a moment.`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'error',
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
      requestAbortRef.current = null;
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    if (!inputMessage.trim() || isTyping) return;
    const text = inputMessage.trim();
    setInputMessage('');
    await dispatchMessage(text);
  };

  const sendVoiceMessage = async (text) => {
    if (!text || isTyping) return;
    await dispatchMessage(text);
  };

  const handleRegenerate = () => {
    if (!lastUserMessageRef.current) return;
    // Remove the last bot message
    setMessages(prev => {
      const lastBotIdx = [...prev].reverse().findIndex(m => m.sender === 'bot' && !m.isWelcome);
      if (lastBotIdx === -1) return prev;
      const idx = prev.length - 1 - lastBotIdx;
      return prev.slice(0, idx);
    });
    dispatchMessage(lastUserMessageRef.current);
  };

  // ── Voice: TTS ─────────────────────────────────────────────────────────

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false); setPlayingMsgId(null);
  };

  const speakText = async (text, msgId = null) => {
    stopAudio();
    if (!text) return;
    // Strip markdown formatting before sending to TTS for cleaner speech
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/^[-*•]\s+/gm, '');

    try {
      setIsSpeaking(true);
      setPlayingMsgId(msgId);
      setVoiceStatus('Speaking...');

      const response = await fetch(`${API_BASE}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'nova' }),
      });
      if (!response.ok) throw new Error('TTS failed');

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus('');
        URL.revokeObjectURL(url); audioRef.current = null;
        if (isVoiceMode) setTimeout(() => startRecording(), 800);
      };
      audio.onerror = () => {
        setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus(''); audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false); setPlayingMsgId(null); setVoiceStatus('');
    }
  };

  // ── Voice: STT ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    if (isRecording) { stopRecording(); return; }
    setSpeechError('');
    setVoiceStatus('Listening...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setVoiceStatus('Transcribing...');
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        await transcribeAndSend(blob, mimeType || 'audio/webm');
      };
      recorder.start();
      setIsRecording(true);
      stopTimeoutRef.current = setTimeout(() => stopRecording(), 30000);
    } catch (err) {
      console.error('Mic error:', err);
      setSpeechError(err.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not access microphone.');
      setVoiceStatus('');
    }
  };

  const stopRecording = () => {
    clearTimeout(stopTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAndSend = async (audioBlob, mimeType) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${mimeType.includes('ogg') ? 'ogg' : 'webm'}`);
      const response = await fetch(`${API_BASE}/api/voice/transcribe`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.text) {
        setSpeechError('Could not understand audio. Please try again.');
        setVoiceStatus(''); return;
      }
      setVoiceStatus('');
      const transcribedText = data.text.trim();
      if (isVoiceMode) await sendVoiceMessage(transcribedText);
      else { setInputMessage(transcribedText); inputRef.current?.focus(); }
    } catch (err) {
      console.error('Transcription error:', err);
      setSpeechError('Transcription failed. Please try again.');
      setVoiceStatus('');
    }
  };

  // ── Voice mode ─────────────────────────────────────────────────────────

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      stopRecording(); stopAudio();
      setIsVoiceMode(false); setVoiceStatus('');
    } else {
      setIsVoiceMode(true);
      startRecording();
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording(); stopAudio(); cancelRequest();
      setIsVoiceMode(false); setVoiceStatus(''); setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => () => {
    stopRecording(); stopAudio(); cancelRequest();
    clearTimeout(stopTimeoutRef.current);
  }, []);

  // ── Misc ───────────────────────────────────────────────────────────────

  const handleQuickReply = (reply) => {
    if (isTyping) return;
    dispatchMessage(reply);
  };

  const handleStarterClick = (text) => {
    if (isTyping) return;
    dispatchMessage(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleSwitchTrip = (trip) => {
    cancelRequest();
    setCurrentTrip(trip);
    setShowTripPicker(false);
    // Force a fresh welcome bubble when context changes mid-session
    setMessages([makeWelcomeMessage()]);
    setActiveConversationId(null);
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const starterKey = !isAuthenticated ? 'guest' : (currentTrip ? tripPhase : 'planning');
  const starters = PROMPT_STARTERS[starterKey] || PROMPT_STARTERS.planning;

  const lastBotMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'bot' && !messages[i].isWelcome) return messages[i].id;
    }
    return null;
  }, [messages]);

  const showStarters = messages.length > 0 && messages.every(m => m.isWelcome) && !isTyping;

  const micBtnClass = ['vi-mic-btn',
    isRecording ? 'vi-mic-btn--recording' : '',
    isVoiceMode ? 'vi-mic-btn--voice-mode' : '',
  ].filter(Boolean).join(' ');

  const windowClass = ['vi-window',
    isSidebarOpen ? 'vi-window--with-sidebar' : '',
    isFullscreen  ? 'vi-window--fullscreen'   : '',
  ].filter(Boolean).join(' ');

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating Chat Button */}
      <div className={`vi-button ${isOpen ? 'active' : ''}`} onClick={toggleChat} title="Chat with Vi">
        {!isOpen ? (
          <>
            <div className="vi-button-icon">
              <i className="fas fa-plane vi-btn-plane"></i>
              <span className="vi-logo">Vi</span>
            </div>
            <span className="vi-pulse"></span>
          </>
        ) : (
          <i className="fas fa-times"></i>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={windowClass}>

          {/* ── Sidebar ────────────────────────────────────────────── */}
          {isSidebarOpen && (
            <div className="vi-sidebar">
              <div className="vi-sidebar__header">
                <span className="vi-sidebar__title">Conversations</span>
                <button className="vi-sidebar__new-btn" onClick={handleNewConversation} title="New conversation">
                  <i className="fas fa-plus"></i> New chat
                </button>
              </div>
              <div className="vi-sidebar__list">
                {isLoadingConversations ? (
                  <div className="vi-sidebar__loading">
                    <span className="vi-sidebar__loading-dots"><span/><span/><span/></span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="vi-sidebar__empty">No past conversations yet</div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.conversation_id}
                      className={`vi-sidebar__item${conv.conversation_id === activeConversationId ? ' vi-sidebar__item--active' : ''}`}
                      onClick={() => handleSelectConversation(conv.conversation_id)}
                    >
                      <div className="vi-sidebar__item-icon">
                        <i className="fas fa-comment-dots"></i>
                      </div>
                      <div className="vi-sidebar__item-body">
                        <span className="vi-sidebar__item-title">{conv.title}</span>
                        <span className="vi-sidebar__item-time">{formatRelativeTime(conv.last_message_at)}</span>
                      </div>
                      <button
                        className="vi-sidebar__item-delete"
                        onClick={(e) => handleDeleteConversation(e, conv.conversation_id)}
                        title="Delete conversation"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Main Chat Area ─────────────────────────────────────── */}
          <div className="vi-chat-main">

            {/* Header */}
            <div className="vi-header">
              <div className="vi-header-content">
                {isAuthenticated && (
                  <button
                    className={`vi-btn-icon vi-btn-history${isSidebarOpen ? ' active' : ''}`}
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    title="Conversation history"
                  >
                    <i className="fas fa-clock-rotate-left"></i>
                  </button>
                )}
                <div className="vi-avatar">
                  {isSpeaking ? (
                    <div className="vi-speaking-animation">
                      <span/><span/><span/><span/><span/>
                    </div>
                  ) : (
                    <i className="fas fa-plane-departure vi-avatar-icon"></i>
                  )}
                </div>
                <div className="vi-header-info">
                  <span className="vi-header-name">Vi <span className="vi-header-tag">AI Concierge</span></span>
                  <span className="vi-status">
                    <span className={`status-dot${isSpeaking ? ' speaking' : isRecording ? ' recording' : ''}`}></span>
                    {isSpeaking      ? 'Vi is speaking...'
                      : isRecording  ? '🎙️ Listening...'
                      : isTyping     ? 'Vi is thinking...'
                      : isAuthenticated ? `Ready when you are, ${user?.name?.split(' ')[0] || 'traveler'} 🌍`
                      : 'Your AI travel buddy'}
                  </span>
                </div>
              </div>
              <div className="vi-header-actions">
                <button
                  className={`vi-btn-icon vi-voice-mode-btn${isVoiceMode ? ' active' : ''}`}
                  onClick={toggleVoiceMode}
                  title={isVoiceMode ? 'Exit voice mode' : 'Voice mode'}
                >
                  <i className={`fas ${isVoiceMode ? 'fa-phone-slash' : 'fa-phone'}`}></i>
                </button>
                <button
                  className="vi-btn-icon"
                  onClick={() => setIsFullscreen(p => !p)}
                  title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
                <button className="vi-btn-icon" onClick={handleNewConversation} title="New conversation">
                  <i className="fas fa-pen-to-square"></i>
                </button>
                <button className="vi-btn-icon" onClick={toggleChat} title="Close chat">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Trip context bar — clickable trip switcher */}
            {isAuthenticated && (currentTrip || userTrips.length > 0) && (
              <div className="vi-trip-bar" ref={tripPickerRef}>
                <button
                  type="button"
                  className="vi-trip-bar__chip"
                  onClick={() => setShowTripPicker(p => !p)}
                  disabled={userTrips.length === 0}
                >
                  <i className={`fas ${tripPhase === 'during' ? 'fa-plane' : tripPhase === 'before' ? 'fa-calendar-check' : tripPhase === 'after' ? 'fa-flag-checkered' : 'fa-compass'}`}></i>
                  <span className="vi-trip-bar__text">
                    {currentTrip
                      ? <>
                          <strong>{currentTrip.destination?.name || 'Trip'}</strong>
                          <span className="vi-trip-bar__sub">
                            {tripPhase === 'before' ? ' · upcoming'
                              : tripPhase === 'during' ? ' · happening now'
                              : tripPhase === 'after' ? ' · past'
                              : ''}
                          </span>
                        </>
                      : <>Pick a trip to focus on</>
                    }
                  </span>
                  {userTrips.length > 0 && <i className="fas fa-chevron-down vi-trip-bar__caret"></i>}
                </button>
                {showTripPicker && userTrips.length > 0 && (
                  <div className="vi-trip-picker">
                    <div className="vi-trip-picker__title">Switch trip context</div>
                    {userTrips.map(t => (
                      <button
                        key={t.trip_id}
                        type="button"
                        className={`vi-trip-picker__item${currentTrip?.trip_id === t.trip_id ? ' vi-trip-picker__item--active' : ''}`}
                        onClick={() => handleSwitchTrip(t)}
                      >
                        <i className="fas fa-location-dot"></i>
                        <div className="vi-trip-picker__body">
                          <span className="vi-trip-picker__name">{t.destination?.name || 'Trip'}</span>
                          <span className="vi-trip-picker__dates">
                            {t.dates?.start_date} → {t.dates?.end_date}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Voice mode banner */}
            {isVoiceMode && (
              <div className="vi-voice-banner">
                <div className="vi-voice-banner__content">
                  <div className={`vi-voice-orb${isRecording ? ' vi-voice-orb--listening' : isSpeaking ? ' vi-voice-orb--speaking' : ''}`}>
                    <i className={`fas ${isSpeaking ? 'fa-volume-high' : 'fa-microphone'}`}></i>
                  </div>
                  <span className="vi-voice-banner__label">
                    {isRecording ? 'Listening... tap mic to stop' : isSpeaking ? 'Vi is responding...' : 'Voice mode — tap mic to speak'}
                  </span>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {showDisclaimer && (
              <div className="vi-disclaimer">
                <div className="disclaimer-content">
                  <i className="fas fa-circle-info"></i>
                  <span>I give general travel guidance — always double-check critical details (prices, schedules, visa rules) before you book.</span>
                </div>
                <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)} title="Got it">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="vi-messages" ref={messagesListRef} onScroll={handleMessagesScroll}>
              {messages.map((message) => {
                const isLastBot = message.id === lastBotMessageId;
                return (
                  <div key={message.id} className={`vi-message ${message.sender}${message.isError ? ' is-error' : ''}`}>
                    {message.sender === 'bot' && (
                      <div className="message-avatar">
                        <i className="fas fa-plane vi-msg-icon"></i>
                      </div>
                    )}
                    <div className="message-content">
                      {message.sender === 'bot'
                        ? (
                          <div
                            className="vi-md"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) || '<p class="vi-thinking-line">Thinking…</p>' }}
                          />
                        )
                        : <p className="vi-user-text">{message.text}</p>
                      }

                      {/* Quick replies */}
                      {message.quickReplies && (
                        <div className="quick-replies">
                          {message.quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              className="quick-reply-btn"
                              onClick={() => handleQuickReply(reply)}
                              disabled={isTyping}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bot message actions */}
                      {message.sender === 'bot' && !message.isWelcome && message.text && (
                        <div className="vi-msg-actions">
                          <button
                            className={`vi-msg-action${playingMsgId === message.id ? ' vi-msg-action--active' : ''}`}
                            onClick={() => playingMsgId === message.id ? stopAudio() : speakText(message.text, message.id)}
                            title={playingMsgId === message.id ? 'Stop audio' : 'Listen'}
                          >
                            <i className={`fas ${playingMsgId === message.id ? 'fa-stop' : 'fa-volume-high'}`}></i>
                          </button>
                          <button
                            className="vi-msg-action"
                            onClick={() => handleCopyMessage(message.text)}
                            title="Copy reply"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                          {isLastBot && (
                            <button
                              className="vi-msg-action"
                              onClick={handleRegenerate}
                              title="Regenerate reply"
                              disabled={isTyping}
                            >
                              <i className="fas fa-arrows-rotate"></i>
                            </button>
                          )}
                        </div>
                      )}

                      <span className="message-time">
                        {message.timestamp instanceof Date
                          ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Prompt starters (only when chat is empty / welcome) */}
              {showStarters && (
                <div className="vi-starters">
                  <div className="vi-starters__title">Try asking Vi:</div>
                  <div className="vi-starters__grid">
                    {starters.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="vi-starter"
                        onClick={() => handleStarterClick(s.text)}
                        disabled={isTyping}
                      >
                        <span className="vi-starter__icon"><i className={`fas ${s.icon}`}></i></span>
                        <span className="vi-starter__label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="vi-message bot typing">
                  <div className="message-avatar"><i className="fas fa-plane vi-msg-icon"></i></div>
                  <div className="message-content">
                    <div className="typing-indicator"><span/><span/><span/></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="vi-input-container">
              {(speechError || voiceStatus) && (
                <p className={`vi-speech-error${voiceStatus && !speechError ? ' vi-speech-status' : ''}`}>
                  <i className={`fas ${speechError ? 'fa-circle-exclamation' : 'fa-circle-info'}`}></i>
                  {speechError || voiceStatus}
                </p>
              )}

              {/* Stop generation button (replaces send while streaming) */}
              {(isTyping) && (
                <button type="button" className="vi-stop-gen" onClick={cancelRequest}>
                  <i className="fas fa-stop"></i> Stop generating
                </button>
              )}

              <form onSubmit={handleSendMessage}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  className={`vi-input${isRecording ? ' vi-input--listening' : ''}`}
                  placeholder={
                    isRecording ? '🎙️ Recording — click mic to stop...'
                    : isVoiceMode ? '🔊 Voice mode active'
                    : isAuthenticated
                      ? (currentTrip
                          ? `Ask Vi about your trip to ${currentTrip.destination?.name || 'your destination'}…`
                          : 'Ask Vi anything — destinations, packing, itineraries…')
                      : 'Ask me about travel…'
                  }
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Auto-grow
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                  onKeyDown={handleKeyPress}
                  disabled={isVoiceMode}
                />
                <button
                  type="button"
                  className={micBtnClass}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                  disabled={isSpeaking}
                >
                  <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                  {isRecording && <span className="vi-mic-pulse"></span>}
                </button>
                <button
                  type="submit"
                  className="vi-send-btn"
                  disabled={!inputMessage.trim() || isTyping || isVoiceMode}
                  title="Send message"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              <p className="vi-input-hint">
                {isVoiceMode
                  ? 'Voice mode — tap the phone icon in the header to exit'
                  : <>Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for newline · 🎙️ for voice</>}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ViAssistant;
