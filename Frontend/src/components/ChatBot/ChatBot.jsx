import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your AI travel assistant. How can I help you plan your trip today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: "Thank you for your message! Our travel experts will help you plan the perfect trip. For immediate assistance, you can also contact us at info@optiontrip.com or call +47-252-254-2542.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className={`chatbot-button ${isOpen ? 'active' : ''}`} onClick={toggleChat}>
        {!isOpen ? (
          <>
            <i className="fas fa-comments"></i>
            <span className="chatbot-pulse"></span>
          </>
        ) : (
          <i className="fas fa-times"></i>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="chatbot-header-text">
                <h4>AI Travel Assistant</h4>
                <span className="chatbot-status">Online</span>
              </div>
            </div>
            <button className="chatbot-minimize" onClick={toggleChat}>
              <i className="fas fa-minus"></i>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message ${message.sender}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chatbot-input"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <button type="submit" className="chatbot-send-btn">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
