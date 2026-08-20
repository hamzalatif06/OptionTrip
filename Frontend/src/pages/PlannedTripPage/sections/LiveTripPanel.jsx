import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { addTripNote } from '../../../services/tripsService';
import { getAccessToken } from '../../../services/authService';
import LeaveTripStoryModal from '../../../components/TripStory/LeaveTripStoryModal';
import './LiveTripPanel.css';

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const fetchWeather = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
    );
    if (!res.ok) return null;
    const j = await res.json();
    const cw = j.current_weather;
    if (!cw) return null;
    return { temp: Math.round(cw.temperature), code: cw.weathercode };
  } catch {
    return null;
  }
};

const LiveTripPanel = ({ tripData, daysData }) => {
  const [weather, setWeather] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const lat = tripData?.destination?.geometry?.lat;
  const lng = tripData?.destination?.geometry?.lng;

  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      fetchWeather(lat, lng).then(setWeather);
    }
  }, [lat, lng]);

  if (tripData?.travel_status !== 'active') return null;

  const today = todayISO();
  const todayPlan = (daysData || []).find((d) => d.date === today);
  const destName = tripData.destination?.name || 'your trip';

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const token = getAccessToken();
      await addTripNote(tripData.trip_id, noteText.trim(), token);
      toast.success('Note saved.');
      setNoteText('');
    } catch {
      toast.error('Could not save note.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="ltp">
      <div className="ltp__header">
        <div>
          <span className="ltp__eyebrow">Live now</span>
          <h2 className="ltp__title">Today in {destName}</h2>
        </div>
        {weather && (
          <div className="ltp__weather">
            <span className="ltp__weather-icon">{WEATHER_ICONS[weather.code] || '🌡️'}</span>
            <span className="ltp__weather-temp">{weather.temp}°C</span>
          </div>
        )}
      </div>

      {todayPlan ? (
        <div className="ltp__plan">
          {(todayPlan.activities || []).slice(0, 6).map((act, i) => (
            <div className="ltp__plan-item" key={i}>
              <span className="ltp__plan-time">{act.time}</span>
              <span className="ltp__plan-title">{act.title}</span>
              <span className="ltp__plan-place">@ {act.place_name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="ltp__no-plan">No activities scheduled for today — a free day to explore.</p>
      )}

      <div className="ltp__actions">
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('vi:open', { detail: { message: `What's worth doing near me in ${destName} today?` } }))}>
          💬 Ask Vi
        </button>
        <button type="button" onClick={() => setShowStoryModal(true)}>
          📍 Leave a tip
        </button>
      </div>

      <div className="ltp__note-row">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
          placeholder="Quick note to remember later…"
        />
        <button type="button" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
          {savingNote ? 'Saving…' : 'Add'}
        </button>
      </div>

      {showStoryModal && (
        <LeaveTripStoryModal
          tripId={tripData.trip_id}
          defaultPlaceName={destName}
          defaultCity={destName}
          onClose={() => setShowStoryModal(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
};

export default LiveTripPanel;
