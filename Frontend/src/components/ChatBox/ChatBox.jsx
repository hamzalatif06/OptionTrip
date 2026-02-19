import React, { useState, useRef } from 'react';
import './ChatBox.css';

const ChatBox = () => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setIsProcessing(true);
      console.log('Generating trip for:', message);
      // Add AI trip generation logic here
      setTimeout(() => {
        setIsProcessing(false);
        setMessage('');
      }, 2000);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chatbox-container">
      {/* Example bubble */}
      <div className="chatbox-example-bubble">
        <div className="example-bubble-content">
          <i className="fas fa-lightbulb theme me-2"></i>
          <span>"I want a 5-day adventure to Turkey with nightlife and beaches"</span>
        </div>
      </div>

      {/* Chat input */}
      <form className="chatbox-form" onSubmit={handleSubmit}>
        <div className="chatbox-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chatbox-input"
            placeholder="Describe your trip…"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <div className="chatbox-actions">
            <button
              type="button"
              className={`chatbox-btn chatbox-btn-mic ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              aria-label="Voice input"
            >
              <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
            <button
              type="submit"
              className={`chatbox-btn chatbox-btn-send ${isProcessing ? 'processing' : ''}`}
              disabled={!message.trim() || isProcessing}
              aria-label="Generate trip"
            >
              <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;

