import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TripPlannerForm.css';
import DestinationAutocomplete from '../GooglePlaces/DestinationAutocomplete';
import { AutocompleteContextProvider } from '../GooglePlaces/AutocompleteContext';
import DateRangePickerComponent from '../DateRangePicker/DateRangePicker';
import GuestSelector from '../GuestSelector/GuestSelector';
import TripTypeSelector from '../TripTypeSelector/TripTypeSelector';
import { generateTripOptions, parseTripDescription } from '../../services/tripsService';

const TRIP_TYPE_LABELS = {
  Adventure: 'Adventure',
  Cultural: 'Cultural',
  Relaxation: 'Relaxation',
  Family: 'Family',
  Romantic: 'Romantic',
  Business: 'Business',
  Budget: 'Budget',
  Luxury: 'Luxury',
};

// ─── Speech Recognition setup (works across browsers + mobile) ───
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const TripPlannerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    destination: { text: '', place_id: '', name: '', geometry: null },
    start_date: '',
    end_date: '',
    duration_days: 0,
    month_year: '',
    tripType: '',
    guests: { total: 0, adults: 0, children: 0, infants: 0, label: '' },
    budget: '',
    description: ''
  });

  const [errors, setErrors]           = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing]       = useState(false);
  const [aiDetected, setAiDetected]     = useState(null);

  // Speech state
  const [isListening, setIsListening]   = useState(false);
  const [speechInterim, setSpeechInterim] = useState(''); // live interim text
  const [speechError, setSpeechError]   = useState('');

  const debounceTimer   = useRef(null);
  const recognitionRef  = useRef(null);
  const speechBaseRef   = useRef(''); // description text snapshot when mic starts

  // ─── Pre-selected destination from session / navigation state ───
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedDestination');
    if (stored) {
      try {
        const d = JSON.parse(stored);
        setFormData(prev => ({
          ...prev,
          destination: { text: d.text || '', place_id: d.place_id || '', name: d.name || '', geometry: d.geometry || null }
        }));
        sessionStorage.removeItem('selectedDestination');
      } catch {
        sessionStorage.removeItem('selectedDestination');
      }
    }
    if (location.state?.destination) {
      const dest = location.state.destination;
      setFormData(prev => ({
        ...prev,
        destination: { text: `${dest.city}, ${dest.country}`, place_id: '', name: dest.city, geometry: null }
      }));
    }
  }, [location.state]);

  // ─── Cleanup speech recognition on unmount ───────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ─── AI auto-fill from parsed data ───────────────────────────────
  const applyParsedData = useCallback((parsed) => {
    setFormData(prev => {
      const next = { ...prev };

      if (parsed.destination?.text) {
        next.destination = {
          text: parsed.destination.text,
          place_id: '',
          name: parsed.destination.name || parsed.destination.text,
          geometry: null
        };
      }

      if (parsed.start_date) next.start_date = parsed.start_date;
      if (parsed.end_date)   next.end_date   = parsed.end_date;

      if (parsed.start_date && parsed.duration_days && !parsed.end_date) {
        const s = new Date(parsed.start_date);
        s.setDate(s.getDate() + parsed.duration_days - 1);
        next.end_date      = s.toISOString().split('T')[0];
        next.duration_days = parsed.duration_days;
      } else if (parsed.start_date && parsed.end_date) {
        const s = new Date(parsed.start_date);
        const e = new Date(parsed.end_date);
        next.duration_days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      } else if (parsed.duration_days) {
        next.duration_days = parsed.duration_days;
      }

      if (next.start_date) {
        next.month_year = new Date(next.start_date)
          .toLocaleString('default', { month: 'long', year: 'numeric' });
      }

      if (parsed.tripType && TRIP_TYPE_LABELS[parsed.tripType]) {
        next.tripType = TRIP_TYPE_LABELS[parsed.tripType];
      }

      if (parsed.guests) {
        const adults   = parsed.guests.adults   ?? 0;
        const children = parsed.guests.children ?? 0;
        const infants  = parsed.guests.infants  ?? 0;
        const total    = adults + children + infants;
        if (total > 0) {
          const parts = [];
          if (adults   > 0) parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
          if (children > 0) parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
          if (infants  > 0) parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
          next.guests = { total, adults, children, infants, label: parts.join(', ') };
        }
      }

      if (parsed.budget) next.budget = parsed.budget;
      return next;
    });

    setErrors(prev => {
      const next = { ...prev };
      if (parsed.destination?.text) delete next.destination;
      if (parsed.start_date || parsed.end_date) delete next.dates;
      if (parsed.tripType) delete next.tripType;
      if (parsed.guests &&
          ((parsed.guests.adults ?? 0) + (parsed.guests.children ?? 0) + (parsed.guests.infants ?? 0)) > 0)
        delete next.guests;
      if (parsed.budget) delete next.budget;
      return next;
    });
  }, []);

  // ─── Debounced AI parse trigger ───────────────────────────────────
  const triggerParse = useCallback((value) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim().length < 10) { setAiDetected(null); return; }

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsParsing(true);
        const result = await parseTripDescription(value);
        if (result.success && result.data) {
          const parsed = result.data;
          const hasAny =
            parsed.destination?.text || parsed.start_date || parsed.tripType ||
            parsed.budget ||
            (parsed.guests && ((parsed.guests.adults ?? 0) + (parsed.guests.children ?? 0) + (parsed.guests.infants ?? 0)) > 0);
          if (hasAny) { setAiDetected(parsed); applyParsedData(parsed); }
        }
      } catch { /* silent */ } finally { setIsParsing(false); }
    }, 900);
  }, [applyParsedData]);

  // ─── Textarea change handler ──────────────────────────────────────
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
    triggerParse(value);
  };

  // ─── Speech-to-Text ───────────────────────────────────────────────
  const startListening = () => {
    if (!SpeechRecognitionAPI) return;
    setSpeechError('');

    // Abort any existing session
    recognitionRef.current?.abort();

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Use browser/device language so ANY language works (Russian, Arabic, etc.)
    recognition.lang          = navigator.language || 'en-US';
    recognition.continuous    = false;   // better battery on mobile
    recognition.interimResults = true;   // live feedback while speaking
    recognition.maxAlternatives = 1;

    // Snapshot the current description text so we can append to it
    speechBaseRef.current = formData.description
      ? formData.description.trimEnd() + ' '
      : '';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechInterim('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }

      if (interim) {
        // Show live preview — don't commit yet
        setSpeechInterim(interim);
        setFormData(prev => ({
          ...prev,
          description: speechBaseRef.current + interim
        }));
      }

      if (final) {
        const committed = speechBaseRef.current + final.trim();
        setSpeechInterim('');
        setFormData(prev => ({ ...prev, description: committed }));
        speechBaseRef.current = committed.trimEnd() + ' ';
        // Trigger AI parse on the committed text
        if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
        triggerParse(committed);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setSpeechInterim('');
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access denied. Please allow mic permission and try again.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setSpeechError('Speech recognition failed. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setSpeechInterim('');
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setSpeechInterim('');
  };

  const toggleSpeech = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ─── Form handlers ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateRangeChange = (dateData) => {
    setFormData(prev => ({
      ...prev,
      start_date: dateData.start_date,
      end_date: dateData.end_date,
      duration_days: dateData.duration_days,
      month_year: dateData.month_year
    }));
    if (errors.dates) setErrors(prev => ({ ...prev, dates: '' }));
  };

  const handleGuestsChange = (guestData) => {
    setFormData(prev => ({ ...prev, guests: guestData }));
    if (errors.guests) setErrors(prev => ({ ...prev, guests: '' }));
  };

  const handleTripTypeChange = (tripType) => {
    setFormData(prev => ({ ...prev, tripType }));
    if (errors.tripType) setErrors(prev => ({ ...prev, tripType: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Stop speech if still running
    recognitionRef.current?.stop();

    const newErrors = {};
    if (!formData.destination?.text) newErrors.destination = 'Destination is required';
    if (!formData.start_date || !formData.end_date) {
      newErrors.dates = 'Dates are required';
    } else if (formData.duration_days < 2 || formData.duration_days > 10) {
      newErrors.dates = 'Duration must be between 2 and 10 days';
    }
    if (formData.guests.total > 10) newErrors.guests = 'Maximum 10 guests allowed';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      setIsSubmitting(true);
      const response = await generateTripOptions(formData);
      if (response.success && response.data?.trip_id) {
        navigate(`/trips/${response.data.trip_id}`);
      } else {
        setErrors({ submit: 'Failed to generate trip options. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to generate trip options. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectedChips = aiDetected ? buildChips(aiDetected, formData) : [];
  const micSupported  = !!SpeechRecognitionAPI;

  return (
    <form className="trip-planner-form" onSubmit={handleSubmit}>

      {/* ── Smart Description Box ─────────────────────────────── */}
      <div className="smart-description-section">
        <label htmlFor="description" className="smart-description-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sparkle-inline">
            <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="url(#sparkleGrad)"/>
            <defs>
              <linearGradient id="sparkleGrad" x1="12" y1="2" x2="12" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0A539D"/>
                <stop offset="1" stopColor="#F30F89"/>
              </linearGradient>
            </defs>
          </svg>
          What you love &amp; where you want to go
        </label>

        <div className={[
          'smart-textarea-wrapper',
          isParsing     ? 'is-parsing'   : '',
          isListening   ? 'is-listening' : '',
          detectedChips.length > 0 ? 'has-chips' : ''
        ].filter(Boolean).join(' ')}>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder='Try: "I want to go to Paris with my wife and 2 kids for 7 days in July, moderate budget, we love food and art"'
            rows="3"
            className={errors.description ? 'error' : ''}
          />

          {/* AI parsing indicator — bottom-left */}
          {isParsing && !isListening && (
            <div className="ai-parsing-indicator">
              <span className="ai-dot-spinner"><span /><span /><span /></span>
              <span className="ai-parsing-text">Reading your trip...</span>
            </div>
          )}

          {/* Live listening indicator — bottom-left */}
          {isListening && (
            <div className="ai-parsing-indicator">
              <span className="mic-wave-indicator">
                <span /><span /><span /><span />
              </span>
              <span className="ai-parsing-text mic-live-text">
                {speechInterim ? 'Listening...' : 'Speak now...'}
              </span>
            </div>
          )}

          {/* Mic button — bottom-right */}
          {micSupported && (
            <button
              type="button"
              className={`mic-btn${isListening ? ' mic-btn--active' : ''}`}
              onClick={toggleSpeech}
              title={isListening ? 'Stop recording' : 'Speak your trip (any language)'}
              aria-label={isListening ? 'Stop recording' : 'Start speech input'}
            >
              {isListening ? (
                /* Stop icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              ) : (
                /* Mic icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Speech error */}
        {speechError && (
          <div className="speech-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {speechError}
          </div>
        )}

        {/* AI detected chips */}
        {detectedChips.length > 0 && (
          <div className="ai-detected-bar">
            <span className="ai-detected-label">AI detected:</span>
            <div className="ai-chips">
              {detectedChips.map((chip, i) => (
                <span key={i} className="ai-chip">
                  <span className="ai-chip-icon">{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      <div className="form-divider">
        <span>confirm or adjust details</span>
      </div>

      <div className="form-grid">
        {/* Destination */}
        <div className={`form-field${formData.destination?.text ? ' field-filled' : ''}`}>
          <AutocompleteContextProvider map_id="map">
            <DestinationAutocomplete
              value={formData.destination}
              onChange={(placeData) => {
                setFormData(prev => ({ ...prev, destination: placeData }));
                if (errors.destination) setErrors(prev => ({ ...prev, destination: '' }));
              }}
              error={errors.destination}
              placeholder="e.g. Paris, France"
            />
          </AutocompleteContextProvider>
        </div>

        {/* Dates */}
        <div className={`form-field${formData.start_date && formData.end_date ? ' field-filled' : ''}`}>
          <DateRangePickerComponent
            selectedDates={[formData.start_date, formData.end_date]}
            onDateRangeChange={handleDateRangeChange}
            error={errors.dates}
          />
        </div>

        {/* Trip Type */}
        <div className={`form-field${formData.tripType ? ' field-filled' : ''}`}>
          <TripTypeSelector value={formData.tripType} onChange={handleTripTypeChange} error={errors.tripType} />
        </div>

        {/* Guests */}
        <div className={`form-field${formData.guests.total > 0 ? ' field-filled' : ''}`}>
          <GuestSelector
            initialGuests={{ adults: formData.guests.adults, children: formData.guests.children, infants: formData.guests.infants }}
            onGuestsChange={handleGuestsChange}
            error={errors.guests}
          />
        </div>

        {/* Budget */}
        <div className={`form-field${formData.budget ? ' field-filled' : ''}`}>
          <label htmlFor="budget">Budget <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.85em' }}>(optional)</span></label>
          <div className="select-wrapper">
            <select id="budget" name="budget" value={formData.budget} onChange={handleInputChange} className={errors.budget ? 'error' : ''}>
              <option value="">Select budget</option>
              <option value="budget">Budget ($)</option>
              <option value="moderate">Moderate ($$)</option>
              <option value="luxury">Luxury ($$$)</option>
              <option value="premium">Premium ($$$$)</option>
            </select>
            <i className="fas fa-chevron-down select-arrow"></i>
          </div>
          {errors.budget && <span className="error-message">{errors.budget}</span>}
        </div>
      </div>

      <div className="form-actions">
        {errors.submit && (
          <span className="error-message" style={{ marginBottom: '12px', display: 'block', textAlign: 'center' }}>
            {errors.submit}
          </span>
        )}
        <button type="submit" className={`search-button${isSubmitting ? ' loading' : ''}`} disabled={isSubmitting}>
          {isSubmitting ? (
            <><span className="btn-spinner"></span><span>Generating...</span></>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Explore</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

function buildChips(parsed, formData) {
  const chips = [];
  if (parsed.destination?.text) chips.push({ icon: '📍', label: parsed.destination.text });
  const dur = formData.duration_days || parsed.duration_days;
  if (parsed.start_date && dur) {
    const s = new Date(parsed.start_date);
    chips.push({ icon: '📅', label: `${s.toLocaleString('default', { month: 'short', day: 'numeric' })} · ${dur} day${dur > 1 ? 's' : ''}` });
  } else if (dur) {
    chips.push({ icon: '📅', label: `${dur} day${dur > 1 ? 's' : ''}` });
  }
  if (parsed.guests) {
    const a = parsed.guests.adults ?? 0, c = parsed.guests.children ?? 0, i = parsed.guests.infants ?? 0;
    const total = a + c + i;
    if (total > 0) {
      const parts = [];
      if (a > 0) parts.push(`${a} adult${a > 1 ? 's' : ''}`);
      if (c > 0) parts.push(`${c} child${c > 1 ? 'ren' : ''}`);
      if (i > 0) parts.push(`${i} infant${i > 1 ? 's' : ''}`);
      chips.push({ icon: '👥', label: parts.join(', ') });
    }
  }
  if (parsed.tripType) chips.push({ icon: '🧭', label: parsed.tripType });
  if (parsed.budget) {
    const l = { budget: 'Budget ($)', moderate: 'Moderate ($$)', luxury: 'Luxury ($$$)', premium: 'Premium ($$$$)' };
    chips.push({ icon: '💰', label: l[parsed.budget] || parsed.budget });
  }
  if (parsed.activities?.length > 0) chips.push({ icon: '❤️', label: parsed.activities.slice(0, 3).join(', ') });
  return chips;
}

export default TripPlannerForm;
