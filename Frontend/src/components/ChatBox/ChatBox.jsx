import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseTripDescription, generateTripOptions } from '../../services/tripsService';
import { logActivity } from '../../services/activityService';
import './ChatBox.css';

const ChatBox = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setError('');

    try {
      const parseResult = await parseTripDescription(text);
      const parsed = parseResult?.data || parseResult || {};

      const tripPayload = {
        description: text,
        destination: parsed.destination || { text: '', place_id: '', name: '', geometry: null },
        origin:      parsed.origin      || { text: '', place_id: '', name: '', geometry: null },
        start_date:  parsed.start_date  || '',
        end_date:    parsed.end_date    || '',
        duration_days: parsed.duration_days || 3,
        month_year:  parsed.month_year  || '',
        tripType:    parsed.tripType    || '',
        guests:      parsed.guests      || { total: 1, adults: 1, children: 0, infants: 0, label: '1 adult' },
        budget:      parsed.budget      || '',
      };

      const response = await generateTripOptions(tripPayload);

      if (response.success && response.data?.trip_id) {
        logActivity({
          type: 'trip',
          action: 'created',
          title: `Started planning: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
          metadata: {
            trip_id:     response.data.trip_id,
            destination: tripPayload.destination?.name || tripPayload.destination?.text || null,
            description: text,
          },
        });
        navigate(`/trips/${response.data.trip_id}`);
      } else {
        setError('Could not generate trip options. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setIsListening(true);
    setError('');
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

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chatbox-container">

      <div className="chatbox-example-bubble">
        <div className="example-bubble-content">
          <i className="fas fa-lightbulb theme me-2"></i>
          <span>"I want a 5-day adventure to Turkey with nightlife and beaches"</span>
        </div>
      </div>


      <form className="chatbox-form" onSubmit={handleSubmit}>
        <div className="chatbox-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chatbox-input"
            placeholder="Describe your dream trip…"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />
          <div className="chatbox-actions">
            <button
              type="button"
              className={`chatbox-btn chatbox-btn-mic ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={isProcessing}
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
        {error && (
          <p className="chatbox-error">{error}</p>
        )}
      </form>

      {isProcessing && (
        <div className="chatbox-loading">
          <i className="fas fa-spinner fa-spin me-2"></i>
          Crafting your perfect trip…
        </div>
      )}
    </div>
  );
};

export default ChatBox;
