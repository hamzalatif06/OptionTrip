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

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

  // Speech
  const [isListening, setIsListening]     = useState(false);
  const [speechError, setSpeechError]     = useState('');

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const recognitionRef  = useRef(null);
  const speechBaseRef   = useRef('');

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

  // On open: load conversations and restore latest (if authenticated)
  useEffect(() => {
    if (!isOpen) return;
    if (isAuthenticated) {
      loadConversations().then(async () => {
        // Will be handled after conversations state updates
      });
    } else if (messages.length === 0) {
      setMessages([makeWelcomeMessage()]);
    }
  }, [isOpen]);

  // After conversations load, restore latest conversation or show welcome
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (conversations.length > 0 && messages.length === 0 && !activeConversationId) {
      // Restore latest conversation
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
    setIsSidebarOpen(false); // close sidebar on mobile after selecting
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

  // ── Speech ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isOpen]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const startListening = () => {
    if (!SpeechRecognitionAPI) { setSpeechError('Speech recognition not supported.'); return; }
    if (isListening) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    setSpeechError('');
    speechBaseRef.current = inputMessage;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    recognition.onstart  = () => setIsListening(true);
    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      const base = speechBaseRef.current;
      setInputMessage(base + (final || interim));
      if (final) speechBaseRef.current = base + final;
    };
    recognition.onerror = (e) => {
      if (e.error !== 'aborted') setSpeechError(e.error === 'not-allowed' ? 'Microphone access denied.' : 'Could not capture speech.');
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.start();
  };

  // ── Messaging ───────────────────────────────────────────────────────────────

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user', timestamp: new Date() }]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(async () => {
      try {
        const token    = isAuthenticated ? getAccessToken() : null;
        const response = await sendChatMessage(userText, token, currentTrip?.trip_id, activeConversationId);

        if (response.success && response.data) {
          const { message, type, quickReplies, conversationId } = response.data;

          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: message,
            sender: 'bot',
            timestamp: new Date(),
            type: type || 'general',
            quickReplies: quickReplies?.length > 0 ? quickReplies : undefined
          }]);

          // Update active conversation and refresh sidebar list
          if (conversationId) {
            if (conversationId !== activeConversationId) {
              setActiveConversationId(conversationId);
              // Refresh list to show new conversation
              const listResp = await getConversations(token);
              if (listResp.success) setConversations(listResp.data.conversations || []);
            } else {
              // Update last_message_at on existing convo in sidebar
              setConversations(prev => prev.map(c =>
                c.conversation_id === conversationId
                  ? { ...c, last_message_at: new Date().toISOString() }
                  : c
              ));
            }
          }
        }
      } catch (err) {
        // Local fallback
        console.log('API failed, using local fallback:', err.message);
        const localResp = localFallback(userText);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: localResp.text,
          sender: 'bot',
          timestamp: new Date(),
          type: localResp.type,
          quickReplies: localResp.quickReplies
        }]);
      } finally {
        setIsTyping(false);
      }
    }, 600);
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
                  <i className="fas fa-plane-departure vi-avatar-icon"></i>
                </div>
                <div className="vi-header-info">
                  <span className="vi-header-name">Vi ✈️</span>
                  <span className="vi-status">
                    <span className="status-dot"></span>
                    {isAuthenticated
                      ? `Hey ${user?.name?.split(' ')[0] || 'there'}, ready to explore? 🌍`
                      : 'Your friendly travel buddy'}
                  </span>
                </div>
              </div>
              <div className="vi-header-actions">
                <button className="vi-btn-icon" onClick={clearConversation} title="New conversation">
                  <i className="fas fa-rotate-right"></i>
                </button>
                <button className="vi-btn-icon" onClick={toggleChat} title="Close chat">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

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
                    {message.quickReplies && (
                      <div className="quick-replies">
                        {message.quickReplies.map((reply, idx) => (
                          <button key={idx} className="quick-reply-btn" onClick={() => handleQuickReply(reply)}>
                            {reply}
                          </button>
                        ))}
                      </div>
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
              {speechError && (
                <p className="vi-speech-error"><i className="fas fa-circle-exclamation"></i> {speechError}</p>
              )}
              <form onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  className={`vi-input${isListening ? ' vi-input--listening' : ''}`}
                  placeholder={isListening ? '🎙️ Listening...' : isAuthenticated ? 'Ask me anything! 😊' : 'Ask me about travel...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
                {SpeechRecognitionAPI && (
                  <button
                    type="button"
                    className={`vi-mic-btn${isListening ? ' vi-mic-btn--active' : ''}`}
                    onClick={startListening}
                    title={isListening ? 'Stop' : 'Speak'}
                  >
                    <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                  </button>
                )}
                <button type="submit" className="vi-send-btn" disabled={!inputMessage.trim() || isTyping}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              <p className="vi-input-hint">Press Enter to send · Shift+Enter for new line</p>
            </div>

          </div>{/* end vi-chat-main */}
        </div>
      )}
    </>
  );
};

export default ViAssistant;
