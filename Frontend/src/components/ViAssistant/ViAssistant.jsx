import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken } from '../../services/authService';
import { getMyTrips } from '../../services/tripsService';
import { sendMessage as sendChatMessage } from '../../services/chatService';
import './ViAssistant.css';

const ViAssistant = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [userTrips, setUserTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripPhase, setTripPhase] = useState('before'); // 'before', 'during', 'after'
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load user's trips when authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadUserTrips();
    }
  }, [isAuthenticated, isOpen]);

  // Determine trip phase based on dates
  useEffect(() => {
    if (currentTrip?.dates) {
      const today = new Date();
      const startDate = new Date(currentTrip.dates.start_date);
      const endDate = new Date(currentTrip.dates.end_date);

      if (today < startDate) {
        setTripPhase('before');
      } else if (today >= startDate && today <= endDate) {
        setTripPhase('during');
      } else {
        setTripPhase('after');
      }
    }
  }, [currentTrip]);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isAuthenticated, user]);

  const loadUserTrips = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoadingTrips(true);
      const token = getAccessToken();
      const response = await getMyTrips(token);

      if (response.success && response.data?.trips) {
        setUserTrips(response.data.trips);

        // Set current/upcoming trip
        const now = new Date();
        const upcomingTrip = response.data.trips.find(trip => {
          const endDate = new Date(trip.dates?.end_date);
          return endDate >= now;
        });

        if (upcomingTrip) {
          setCurrentTrip(upcomingTrip);
        } else if (response.data.trips.length > 0) {
          setCurrentTrip(response.data.trips[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user trips:', error);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const generateWelcomeMessage = () => {
    let welcomeText = '';

    if (isAuthenticated && user) {
      const firstName = user.name?.split(' ')[0] || 'there';
      welcomeText = `Hello ${firstName}! 👋 I'm Vi, your AI travel assistant. `;

      if (currentTrip) {
        const destination = currentTrip.destination?.name || 'your destination';
        if (tripPhase === 'before') {
          welcomeText += `I see you have an upcoming trip to ${destination}! I'm here to help you prepare. Would you like tips on what to pack, local customs, or must-see attractions?`;
        } else if (tripPhase === 'during') {
          welcomeText += `I hope you're enjoying ${destination}! Need any help with directions, local recommendations, or emergency information?`;
        } else {
          welcomeText += `How was your trip to ${destination}? I'd love to help you plan your next adventure or answer any questions about your experience!`;
        }
      } else {
        welcomeText += `I'm here to help you plan your perfect trip. What destination are you dreaming about?`;
      }
    } else {
      welcomeText = `Hello! 👋 I'm Vi, your AI travel assistant. I'm here to help you throughout your journey! Log in to access your saved trips and personalized assistance, or ask me anything about travel!`;
    }

    return {
      id: 1,
      text: welcomeText,
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome',
      quickReplies: getContextualQuickReplies()
    };
  };

  const getContextualQuickReplies = () => {
    if (!isAuthenticated) {
      return ['Travel Tips', 'Popular Destinations', 'How to Plan'];
    }

    if (currentTrip) {
      if (tripPhase === 'before') {
        return ['Packing Tips', 'Local Customs', 'Must-See Places', 'Weather Info'];
      } else if (tripPhase === 'during') {
        return ['Emergency Help', 'Nearby Places', 'Restaurant Tips', 'Transportation'];
      } else {
        return ['Plan New Trip', 'Share Experience', 'Travel Tips'];
      }
    }

    return ['Plan a Trip', 'My Trips', 'Travel Tips'];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  // Get user context summary
  const getUserContextSummary = () => {
    if (!isAuthenticated || !user) return null;

    return {
      name: user.name,
      email: user.email,
      hasTrips: userTrips.length > 0,
      tripCount: userTrips.length,
      currentTrip: currentTrip ? {
        destination: currentTrip.destination?.name,
        startDate: currentTrip.dates?.start_date,
        endDate: currentTrip.dates?.end_date,
        duration: currentTrip.dates?.duration_days,
        tripType: currentTrip.trip_type,
        guests: currentTrip.guests?.total,
        budget: currentTrip.budget
      } : null,
      tripPhase
    };
  };

  // Process user message and generate response
  const processMessage = async (userText) => {
    // Try to use backend API first
    try {
      const token = isAuthenticated ? getAccessToken() : null;
      const response = await sendChatMessage(userText, token, currentTrip?.trip_id);

      if (response.success && response.data) {
        return {
          text: response.data.message,
          type: response.data.type || 'general',
          quickReplies: response.data.quickReplies || getContextualQuickReplies()
        };
      }
    } catch (apiError) {
      console.log('Using local fallback for chat:', apiError.message);
      // Fall through to local processing
    }

    // Local fallback processing
    const lowerText = userText.toLowerCase().trim();
    const userContext = getUserContextSummary();

    // Check for greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerText)) {
      const name = userContext?.name?.split(' ')[0] || '';
      return {
        text: `Hello${name ? ` ${name}` : ''}! 😊 How can I help you today?`,
        type: 'greeting',
        quickReplies: getContextualQuickReplies()
      };
    }

    // My trips query
    if (lowerText.includes('my trip') || lowerText.includes('my booking') || lowerText.includes('show trip')) {
      if (!isAuthenticated) {
        return {
          text: `To view your trips, please log in first. Once logged in, I'll have access to all your saved itineraries and can provide personalized assistance! 🔐`,
          type: 'auth_required'
        };
      }

      if (userTrips.length === 0) {
        return {
          text: `You don't have any saved trips yet. Would you like me to help you plan your first adventure? 🌍`,
          type: 'info',
          quickReplies: ['Plan a Trip', 'Popular Destinations']
        };
      }

      const tripsList = userTrips.slice(0, 3).map((trip, idx) => {
        const dest = trip.destination?.name || 'Unknown';
        const dates = trip.dates ? `${formatDate(trip.dates.start_date)} - ${formatDate(trip.dates.end_date)}` : '';
        return `${idx + 1}. ${dest} ${dates ? `(${dates})` : ''}`;
      }).join('\n');

      return {
        text: `📋 Here are your trips:\n\n${tripsList}${userTrips.length > 3 ? `\n\n...and ${userTrips.length - 3} more` : ''}\n\nWould you like details about any specific trip?`,
        type: 'trips_list',
        quickReplies: ['Current Trip Details', 'Plan New Trip']
      };
    }

    // Current trip details
    if ((lowerText.includes('current trip') || lowerText.includes('trip detail') || lowerText.includes('upcoming trip')) && currentTrip) {
      const dest = currentTrip.destination?.name || 'your destination';
      const startDate = formatDate(currentTrip.dates?.start_date);
      const endDate = formatDate(currentTrip.dates?.end_date);
      const duration = currentTrip.dates?.duration_days || 0;
      const guests = currentTrip.guests?.total || 1;
      const tripType = currentTrip.trip_type || 'Leisure';
      const budget = currentTrip.budget ? currentTrip.budget.charAt(0).toUpperCase() + currentTrip.budget.slice(1) : 'Standard';

      return {
        text: `✈️ **Your Trip to ${dest}**\n\n📅 Dates: ${startDate} - ${endDate}\n⏱️ Duration: ${duration} days\n👥 Travelers: ${guests}\n🎯 Trip Type: ${tripType}\n💰 Budget: ${budget}\n\n${tripPhase === 'before' ? 'Your trip is coming up! Need help preparing?' : tripPhase === 'during' ? 'Enjoy your trip! Need any assistance?' : 'Hope you had a great trip!'}`,
        type: 'trip_details',
        quickReplies: tripPhase === 'before'
          ? ['Packing List', 'Weather Forecast', 'Local Tips']
          : tripPhase === 'during'
          ? ['Emergency Info', 'Nearby Restaurants', 'Directions']
          : ['Share Experience', 'Plan Next Trip']
      };
    }

    // Emergency/Help
    if (lowerText.includes('help') || lowerText.includes('emergency') || lowerText.includes('urgent') || lowerText.includes('sos')) {
      const destination = currentTrip?.destination?.name || 'your destination';
      return {
        text: `🆘 **Emergency Information**\n\nFor immediate emergencies:\n🚨 Emergency: 112 (International)\n🚨 US: 911 | UK: 999 | EU: 112\n\n${currentTrip ? `For ${destination}, I recommend saving these contacts:\n• Local police\n• Nearest hospital\n• Your hotel's emergency number\n• Embassy/consulate` : ''}\n\n**I can help with:**\n• Hotel contact information\n• Local emergency services\n• Rebooking assistance\n• Travel insurance claims\n\nWhat do you need help with?`,
        type: 'emergency',
        quickReplies: ['Hotel Contact', 'Local Embassy', 'Travel Insurance']
      };
    }

    // Weather info
    if (lowerText.includes('weather') || lowerText.includes('forecast') || lowerText.includes('climate')) {
      const destination = currentTrip?.destination?.name || 'your destination';
      return {
        text: `🌤️ **Weather Tips for ${destination}**\n\nI recommend checking:\n• Weather.com or AccuWeather for accurate forecasts\n• Local weather apps for real-time updates\n\n**General packing tips:**\n• Always bring layers for temperature changes\n• Pack a light rain jacket\n• Check the forecast 2-3 days before departure\n\nWould you like tips on what to pack based on typical weather?`,
        type: 'weather',
        quickReplies: ['Packing Tips', 'What to Wear', 'Seasonal Info']
      };
    }

    // Packing tips
    if (lowerText.includes('pack') || lowerText.includes('luggage') || lowerText.includes('what to bring')) {
      const tripType = currentTrip?.trip_type || 'leisure';
      const duration = currentTrip?.dates?.duration_days || 5;

      return {
        text: `🧳 **Packing Essentials for ${duration}-Day ${tripType} Trip**\n\n**Must-Haves:**\n• Passport & travel documents\n• Phone charger & adapter\n• Medications & first-aid kit\n• Copies of important documents\n\n**Clothing (${duration} days):**\n• ${Math.ceil(duration * 0.7)} tops\n• ${Math.ceil(duration * 0.5)} bottoms\n• ${Math.ceil(duration * 1.2)} underwear\n• Comfortable walking shoes\n• One formal outfit\n\n**Pro Tips:**\n• Roll clothes to save space\n• Use packing cubes\n• Wear bulkiest items on plane\n\nNeed a destination-specific packing list?`,
        type: 'packing',
        quickReplies: ['Tech Essentials', 'Toiletries', 'Documents Checklist']
      };
    }

    // Restaurant/Food
    if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('dining') || lowerText.includes('hungry')) {
      const destination = currentTrip?.destination?.name || 'your destination';
      return {
        text: `🍽️ **Dining Tips for ${destination}**\n\nTo find the best restaurants:\n• Check TripAdvisor, Yelp, or Google Maps reviews\n• Ask your hotel concierge for local favorites\n• Look for places busy with locals\n• Try the local specialty dishes!\n\n**Dining Etiquette Tips:**\n• Research tipping customs\n• Learn basic food phrases\n• Note typical meal times (may differ from home)\n\nWant specific cuisine recommendations?`,
        type: 'dining',
        quickReplies: ['Local Cuisine', 'Budget Eats', 'Fine Dining']
      };
    }

    // Transportation
    if (lowerText.includes('transport') || lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('bus') || lowerText.includes('train') || lowerText.includes('getting around')) {
      const destination = currentTrip?.destination?.name || 'your destination';
      return {
        text: `🚕 **Transportation in ${destination}**\n\n**Common Options:**\n• Ride-sharing: Uber, Lyft, local alternatives\n• Public transit: Usually cheapest option\n• Taxis: Use official taxi stands\n• Rental cars: Good for exploring outside city\n\n**Tips:**\n• Download offline maps before you go\n• Get a local transit card if staying 3+ days\n• Know approximate taxi fares to avoid scams\n• Airport transfers are often available through your hotel\n\nNeed specific route information?`,
        type: 'transport',
        quickReplies: ['Airport Transfer', 'Public Transit', 'Car Rental']
      };
    }

    // Local customs/culture
    if (lowerText.includes('custom') || lowerText.includes('culture') || lowerText.includes('etiquette') || lowerText.includes('local tip')) {
      const destination = currentTrip?.destination?.name || 'your destination';
      return {
        text: `🌍 **Cultural Tips for ${destination}**\n\n**General Travel Etiquette:**\n• Learn basic local phrases (hello, thank you, please)\n• Research dress codes for religious sites\n• Understand tipping customs\n• Be mindful of photography rules\n• Respect local customs and traditions\n\n**Common Courtesies:**\n• Ask before photographing people\n• Remove shoes when entering homes\n• Be patient with language barriers\n• Show appreciation for local hospitality\n\nWould you like specific cultural information?`,
        type: 'culture',
        quickReplies: ['Language Phrases', 'Dress Code', 'Do\'s and Don\'ts']
      };
    }

    // Planning a new trip
    if (lowerText.includes('plan') && (lowerText.includes('trip') || lowerText.includes('travel') || lowerText.includes('vacation'))) {
      return {
        text: `🗺️ **Let's Plan Your Perfect Trip!**\n\nI can help you think through:\n• Destination ideas based on your interests\n• Best time to visit\n• Trip duration suggestions\n• Budget planning\n• Must-see attractions\n\nTo get started, tell me:\n1. Where would you like to go? (or need ideas?)\n2. When are you thinking of traveling?\n3. What type of experience are you looking for?\n\nOr use our Trip Planner on the homepage for a detailed itinerary!`,
        type: 'planning',
        quickReplies: ['Popular Destinations', 'Beach Vacation', 'City Break', 'Adventure Trip']
      };
    }

    // Thank you responses
    if (lowerText.includes('thank') || lowerText.includes('thanks')) {
      const name = userContext?.name?.split(' ')[0] || '';
      return {
        text: `You're welcome${name ? `, ${name}` : ''}! 🌟 I'm always here to help. Have a wonderful ${tripPhase === 'during' ? 'time on your trip' : 'day'}! Feel free to ask if you need anything else. ✈️`,
        type: 'friendly'
      };
    }

    // Positive feedback
    if (lowerText.includes('great') || lowerText.includes('good') || lowerText.includes('fine') || lowerText.includes('amazing') || lowerText.includes('wonderful')) {
      const destination = currentTrip?.destination?.name;
      return {
        text: `That's wonderful to hear! 😊 ${destination && tripPhase === 'during' ? `I hope ${destination} is treating you well!` : ''} Is there anything else I can help you with?`,
        type: 'friendly',
        quickReplies: getContextualQuickReplies()
      };
    }

    // Default response
    const name = userContext?.name?.split(' ')[0] || '';
    const destination = currentTrip?.destination?.name;

    return {
      text: `Thanks for reaching out${name ? `, ${name}` : ''}! I'm here to help with your travel needs${destination ? ` for ${destination}` : ''}.\n\n**I can assist with:**\n• 📋 Trip planning & itineraries\n• 🏨 Accommodation questions\n• 🍽️ Restaurant recommendations\n• 🚕 Transportation tips\n• 🌍 Local customs & culture\n• 🆘 Emergency assistance\n• 🧳 Packing advice\n\nWhat would you like to know?`,
      type: 'general',
      quickReplies: getContextualQuickReplies()
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    const userMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(async () => {
      const botResponse = await processMessage(userText);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        type: botResponse.type,
        quickReplies: botResponse.quickReplies
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    setTimeout(() => {
      const form = inputRef.current?.form;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    // Re-initialize with welcome message
    setTimeout(() => {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([welcomeMessage]);
    }, 100);
  };

  // Render markdown-like formatting
  const renderMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      // Handle bold text
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className={`vi-button ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
        {!isOpen ? (
          <>
            <div className="vi-button-icon">
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
        <div className="vi-window">
          <div className="vi-header">
            <div className="vi-header-content">
              <div className="vi-avatar">
                <span className="vi-logo-small">Vi</span>
              </div>
              <div className="vi-header-text">
                <h4>Vi - Your Travel Buddy</h4>
                <span className="vi-status">
                  <span className="status-dot"></span>
                  {isAuthenticated ? `Hi, ${user?.name?.split(' ')[0] || 'there'}!` : 'Online'}
                </span>
              </div>
            </div>
            <div className="vi-header-actions">
              <button className="vi-btn-icon" onClick={clearConversation} title="Start New Conversation">
                <i className="fas fa-redo"></i>
              </button>
              <button className="vi-btn-icon" onClick={toggleChat} title="Minimize">
                <i className="fas fa-minus"></i>
              </button>
            </div>
          </div>

          {/* User Trip Context Banner */}
          {isAuthenticated && currentTrip && (
            <div className="vi-trip-context">
              <div className="trip-context-content">
                <i className={`fas ${tripPhase === 'during' ? 'fa-plane' : tripPhase === 'before' ? 'fa-calendar-check' : 'fa-flag-checkered'}`}></i>
                <span>
                  {tripPhase === 'before' && `Upcoming: ${currentTrip.destination?.name}`}
                  {tripPhase === 'during' && `Currently in: ${currentTrip.destination?.name}`}
                  {tripPhase === 'after' && `Last trip: ${currentTrip.destination?.name}`}
                </span>
              </div>
            </div>
          )}

          {/* Disclaimer Banner */}
          {showDisclaimer && (
            <div className="vi-disclaimer">
              <div className="disclaimer-content">
                <i className="fas fa-info-circle"></i>
                <span>
                  <strong>AI Assistant:</strong> Vi provides general travel guidance. Verify critical information.
                </span>
              </div>
              <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <div className="vi-messages">
            {messages.map((message) => (
              <div key={message.id} className={`vi-message ${message.sender}`}>
                {message.sender === 'bot' && (
                  <div className="message-avatar">
                    <span className="vi-logo-tiny">Vi</span>
                  </div>
                )}
                <div className="message-content">
                  <p>{renderMessageText(message.text)}</p>
                  {message.quickReplies && (
                    <div className="quick-replies">
                      {message.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          className="quick-reply-btn"
                          onClick={() => handleQuickReply(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="vi-message bot typing">
                <div className="message-avatar">
                  <span className="vi-logo-tiny">Vi</span>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="vi-input-container">
            <form onSubmit={handleSendMessage}>
              <input
                ref={inputRef}
                type="text"
                className="vi-input"
                placeholder={
                  isAuthenticated
                    ? "Ask me anything about your trip..."
                    : "Ask me about travel..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <button type="submit" className="vi-send-btn" disabled={!inputMessage.trim() || isTyping}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ViAssistant;
