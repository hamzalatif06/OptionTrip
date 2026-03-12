import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import { getMyTrips } from '../../services/tripsService';
import {
  sendMessage as sendChatMessage,
  getConversations,
  getConversation,
  deleteConversation
} from '../../services/chatService';
import './ViAssistant.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const ViAssistant = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  // Chat state
  const [isOpen, setIsOpen]               = useState(false);
  const [messages, setMessages]           = useState([]);
  const [inputMessage, setInputMessage]   = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Trip context
  const [userTrips, setUserTrips]         = useState([]);
  const [currentTrip, setCurrentTrip]     = useState(null);
  const [tripPhase, setTripPhase]         = useState('before');
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  // Conversation persistence
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations]               = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]               = useState(false);

  // ── Voice state ──────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording]   = useState(false);   // MediaRecorder active
  const [isSpeaking, setIsSpeaking]     = useState(false);   // TTS audio is playing
  const [isVoiceMode, setIsVoiceMode]   = useState(false);   // full voice-conversation mode
  const [voiceStatus, setVoiceStatus]   = useState('');      // status label under mic
  const [playingMsgId, setPlayingMsgId] = useState(null);    // which msg's audio is playing
  const [speechError, setSpeechError]   = useState('');

  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const audioRef         = useRef(null);          // current playing <audio> element
  const stopTimeoutRef   = useRef(null);

  // ── Trip loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated && isOpen) loadUserTrips();
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (currentTrip?.dates) {
      const today = new Date();
      const start = new Date(currentTrip.dates.start_date);
      const end   = new Date(currentTrip.dates.end_date);
      setTripPhase(today < start ? 'before' : today <= end ? 'during' : 'after');
    }
  }, [currentTrip]);

  const loadUserTrips = async () => {
    try {
      setIsLoadingTrips(true);
      const token    = getAccessToken();
      const response = await getMyTrips(token);
      if (response.success && response.data?.trips) {
        setUserTrips(response.data.trips);
        const now  = new Date();
        const upcoming = response.data.trips.find(t => new Date(t.dates?.end_date) >= now);
        setCurrentTrip(upcoming || response.data.trips[0] || null);
      }
    } catch (err) {
      console.error('Error loading user trips:', err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // ── Conversation loading ────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingConversations(true);
      const token    = getAccessToken();
      const response = await getConversations(token);
      if (response.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return;
    if (isAuthenticated) {
      loadConversations();
    } else if (messages.length === 0) {
      setMessages([makeWelcomeMessage()]);
    }
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
          id: i,
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
    setMessages([]);
    loadConversationMessages(convId);
    setIsSidebarOpen(false);
  };

  const handleNewConversation = () => {
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

  // ── Welcome message ─────────────────────────────────────────────────────────

  const makeWelcomeMessage = () => {
    let text = '';
    if (isAuthenticated && user) {
      const firstName = user.name?.split(' ')[0] || 'there';
      text = `Hello ${firstName}! 👋 I'm Vi, your AI travel assistant. `;
      if (currentTrip) {
        const dest = currentTrip.destination?.name || 'your destination';
        if (tripPhase === 'before')  text += `I see you have an upcoming trip to ${dest}! I'm here to help you prepare. Would you like tips on what to pack, local customs, or must-see attractions?`;
        else if (tripPhase === 'during') text += `I hope you're enjoying ${dest}! Need any help with directions, local recommendations, or emergency information?`;
        else text += `How was your trip to ${dest}? I'd love to help you plan your next adventure!`;
      } else {
        text += `I'm here to help you plan your perfect trip. What destination are you dreaming about?`;
      }
    } else {
      text = `Hello! 👋 I'm Vi, your AI travel assistant. Log in to access your saved trips and personalized assistance, or ask me anything about travel!`;
    }
    return {
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome',
      quickReplies: getQuickReplies()
    };
  };

  const getQuickReplies = () => {
    if (!isAuthenticated) return ['Travel Tips', 'Popular Destinations', 'How to Plan'];
    if (currentTrip) {
      if (tripPhase === 'before')  return ['Packing Tips', 'Local Customs', 'Must-See Places', 'Weather Info'];
      if (tripPhase === 'during')  return ['Emergency Help', 'Nearby Places', 'Restaurant Tips', 'Transportation'];
      return ['Plan New Trip', 'Share Experience', 'Travel Tips'];
    }
    return ['Plan a Trip', 'My Trips', 'Travel Tips'];
  };

  // ── Voice: TTS speak ─────────────────────────────────────────────────────────

  /**
   * Play TTS for a given text via backend /api/voice/speak
   * @param {string} text
   * @param {number|null} msgId  — ID of the message being played (for button state)
   */
  const speakText = async (text, msgId = null) => {
    // Stop any currently playing audio
    stopAudio();

    try {
      setIsSpeaking(true);
      setPlayingMsgId(msgId);
      setVoiceStatus('Speaking...');

      const response = await fetch(`${API_BASE}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'nova' }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setPlayingMsgId(null);
        setVoiceStatus('');
        URL.revokeObjectURL(url);
        audioRef.current = null;

        // In voice mode: start listening again after TTS finishes
        if (isVoiceMode) {
          setTimeout(() => startRecording(), 800);
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setPlayingMsgId(null);
        setVoiceStatus('');
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
      setPlayingMsgId(null);
      setVoiceStatus('');
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setPlayingMsgId(null);
  };

  // ── Voice: Whisper STT ───────────────────────────────────────────────────────

  const startRecording = async () => {
    if (isRecording) { stopRecording(); return; }

    setSpeechError('');
    setVoiceStatus('Listening...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer webm/opus, fall back to whatever is supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

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

      // Auto-stop after 30 seconds
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

      const response = await fetch(`${API_BASE}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.text) {
        setSpeechError('Could not understand audio. Please try again.');
        setVoiceStatus('');
        return;
      }

      setVoiceStatus('');
      const transcribedText = data.text.trim();

      if (isVoiceMode) {
        // In voice mode: auto-send the transcription
        await sendVoiceMessage(transcribedText);
      } else {
        // Normal mode: put transcription in input field
        setInputMessage(transcribedText);
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setSpeechError('Transcription failed. Please try again.');
      setVoiceStatus('');
    }
  };

  // ── Voice Mode ───────────────────────────────────────────────────────────────

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // Turn off voice mode
      stopRecording();
      stopAudio();
      setIsVoiceMode(false);
      setVoiceStatus('');
    } else {
      // Turn on voice mode — start listening immediately
      setIsVoiceMode(true);
      startRecording();
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      stopAudio();
      setIsVoiceMode(false);
      setVoiceStatus('');
    }
  }, [isOpen]);

  useEffect(() => () => {
    stopRecording();
    stopAudio();
    clearTimeout(stopTimeoutRef.current);
  }, []);

  // ── Messaging ───────────────────────────────────────────────────────────────

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  /**
   * Core send logic — shared between text form submit and voice mode
   */
  const dispatchMessage = async (userText) => {
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user', timestamp: new Date() }]);
    setIsTyping(true);

    setTimeout(async () => {
      let botText = null;
      let botMsg  = null;
      try {
        const token    = isAuthenticated ? getAccessToken() : null;
        const response = await sendChatMessage(userText, token, currentTrip?.trip_id, activeConversationId);

        if (response.success && response.data) {
          const { message, type, quickReplies, conversationId } = response.data;
          botText = message;
          botMsg  = { id: Date.now() + 1, text: message, sender: 'bot', timestamp: new Date(), type: type || 'general', quickReplies: quickReplies?.length > 0 ? quickReplies : undefined };

          setMessages(prev => [...prev, botMsg]);

          if (conversationId) {
            if (conversationId !== activeConversationId) {
              setActiveConversationId(conversationId);
              const listResp = await getConversations(token);
              if (listResp.success) setConversations(listResp.data.conversations || []);
            } else {
              setConversations(prev => prev.map(c =>
                c.conversation_id === conversationId
                  ? { ...c, last_message_at: new Date().toISOString() }
                  : c
              ));
            }
          }
        }
      } catch (err) {
        const localResp = localFallback(userText);
        botText = localResp.text;
        botMsg  = { id: Date.now() + 1, text: localResp.text, sender: 'bot', timestamp: new Date(), type: localResp.type, quickReplies: localResp.quickReplies };
        setMessages(prev => [...prev, botMsg]);
      } finally {
        setIsTyping(false);
        // Auto-play TTS in voice mode
        if (botText && isVoiceMode) {
          await speakText(botText, botMsg?.id ?? null);
        }
      }
    }, 600);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    const text = inputMessage.trim();
    setInputMessage('');
    await dispatchMessage(text);
  };

  const sendVoiceMessage = async (text) => {
    if (!text || isTyping) return;
    await dispatchMessage(text);
  };

  const localFallback = (text) => {
    const lower = text.toLowerCase();
    const dest  = currentTrip?.destination?.name || '';
    const name  = user?.name?.split(' ')[0] || '';
    if (/^(hi|hello|hey)/i.test(lower)) return { text: `Hello${name ? ` ${name}` : ''}! How can I help?`, type: 'greeting', quickReplies: getQuickReplies() };
    if (lower.includes('pack')) return { text: `Pack documents, charger, medications and appropriate clothing for your trip${dest ? ` to ${dest}` : ''}!`, type: 'packing', quickReplies: ['Weather Info', 'Documents'] };
    return { text: `I'm here to help with your travel needs${dest ? ` for ${dest}` : ''}! Ask me about packing, local tips, restaurants, or emergency info.`, type: 'general', quickReplies: getQuickReplies() };
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    setTimeout(() => inputRef.current?.form?.requestSubmit(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  };

  const clearConversation = () => {
    setMessages([makeWelcomeMessage()]);
    setActiveConversationId(null);
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderMessageText = (text) =>
    text.split('\n').map((line, i, arr) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      );
    });

  const micBtnClass = [
    'vi-mic-btn',
    isRecording ? 'vi-mic-btn--recording' : '',
    isVoiceMode  ? 'vi-mic-btn--voice-mode' : '',
  ].filter(Boolean).join(' ');

  // ── Render ───────────────────────────────────────────────────────────────────

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
        <div className={`vi-window${isSidebarOpen ? ' vi-window--with-sidebar' : ''}`}>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          {isSidebarOpen && (
            <div className="vi-sidebar">
              <div className="vi-sidebar__header">
                <span className="vi-sidebar__title">Conversations</span>
                <button className="vi-sidebar__new-btn" onClick={handleNewConversation} title="New conversation">
                  <i className="fas fa-plus"></i> New Chat
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

          {/* ── Main Chat Area ───────────────────────────────────────────── */}
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
                  <span className="vi-header-name">Vi ✈️</span>
                  <span className="vi-status">
                    <span className={`status-dot${isSpeaking ? ' speaking' : isRecording ? ' recording' : ''}`}></span>
                    {isSpeaking
                      ? 'Vi is speaking...'
                      : isRecording
                      ? '🎙️ Listening...'
                      : isAuthenticated
                      ? `Hey ${user?.name?.split(' ')[0] || 'there'}, ready to explore? 🌍`
                      : 'Your friendly travel buddy'}
                  </span>
                </div>
              </div>
              <div className="vi-header-actions">
                {/* Voice Mode toggle */}
                <button
                  className={`vi-btn-icon vi-voice-mode-btn${isVoiceMode ? ' active' : ''}`}
                  onClick={toggleVoiceMode}
                  title={isVoiceMode ? 'Exit voice mode' : 'Voice mode'}
                >
                  <i className={`fas ${isVoiceMode ? 'fa-phone-slash' : 'fa-phone'}`}></i>
                </button>
                <button className="vi-btn-icon" onClick={clearConversation} title="New conversation">
                  <i className="fas fa-rotate-right"></i>
                </button>
                <button className="vi-btn-icon" onClick={toggleChat} title="Close chat">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Voice Mode Banner */}
            {isVoiceMode && (
              <div className="vi-voice-banner">
                <div className="vi-voice-banner__content">
                  <div className={`vi-voice-orb${isRecording ? ' vi-voice-orb--listening' : isSpeaking ? ' vi-voice-orb--speaking' : ''}`}>
                    <i className={`fas ${isSpeaking ? 'fa-volume-high' : 'fa-microphone'}`}></i>
                  </div>
                  <span className="vi-voice-banner__label">
                    {isRecording ? 'Listening... tap mic to stop' : isSpeaking ? 'Vi is responding...' : 'Voice mode active — tap mic to speak'}
                  </span>
                </div>
              </div>
            )}

            {/* Trip Context Banner */}
            {isAuthenticated && currentTrip && (
              <div className="vi-trip-context">
                <div className="trip-context-content">
                  <i className={`fas ${tripPhase === 'during' ? 'fa-plane' : tripPhase === 'before' ? 'fa-calendar-check' : 'fa-flag-checkered'}`}></i>
                  <span>
                    {tripPhase === 'before' && `✈️ Upcoming trip to ${currentTrip.destination?.name}`}
                    {tripPhase === 'during' && `🌍 You're in ${currentTrip.destination?.name} right now!`}
                    {tripPhase === 'after'  && `🎉 Memories from ${currentTrip.destination?.name}`}
                  </span>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {showDisclaimer && (
              <div className="vi-disclaimer">
                <div className="disclaimer-content">
                  <i className="fas fa-circle-info"></i>
                  <span>I give general travel tips — always double-check critical info before you go! 😊</span>
                </div>
                <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)} title="Got it">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="vi-messages">
              {messages.map((message) => (
                <div key={message.id} className={`vi-message ${message.sender}`}>
                  {message.sender === 'bot' && (
                    <div className="message-avatar">
                      <i className="fas fa-plane vi-msg-icon"></i>
                    </div>
                  )}
                  <div className="message-content">
                    <p>{renderMessageText(message.text)}</p>

                    {/* Quick replies */}
                    {message.quickReplies && (
                      <div className="quick-replies">
                        {message.quickReplies.map((reply, idx) => (
                          <button key={idx} className="quick-reply-btn" onClick={() => handleQuickReply(reply)}>
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Listen button — only on bot messages */}
                    {message.sender === 'bot' && (
                      <button
                        className={`vi-listen-btn${playingMsgId === message.id ? ' vi-listen-btn--playing' : ''}`}
                        onClick={() => playingMsgId === message.id ? stopAudio() : speakText(message.text, message.id)}
                        title={playingMsgId === message.id ? 'Stop audio' : 'Listen to this message'}
                      >
                        <i className={`fas ${playingMsgId === message.id ? 'fa-stop' : 'fa-volume-high'}`}></i>
                        <span>{playingMsgId === message.id ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}

                    <span className="message-time">
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
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
              <form onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  className={`vi-input${isRecording ? ' vi-input--listening' : ''}`}
                  placeholder={
                    isRecording ? '🎙️ Recording — click mic to stop...'
                    : isVoiceMode ? '🔊 Voice mode active'
                    : isAuthenticated ? 'Ask me anything! 😊'
                    : 'Ask me about travel...'
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isVoiceMode}
                />
                {/* Mic button — Whisper-powered */}
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
                <button type="submit" className="vi-send-btn" disabled={!inputMessage.trim() || isTyping || isVoiceMode}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              <p className="vi-input-hint">
                {isVoiceMode
                  ? 'Voice mode — click phone icon in header to exit'
                  : 'Press Enter to send · 🎙️ mic for voice input'}
              </p>
            </div>

          </div>{/* end vi-chat-main */}
        </div>
      )}
    </>
  );
};

export default ViAssistant;
