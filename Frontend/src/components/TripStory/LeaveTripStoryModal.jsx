import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { createTripStoryEntry, refineTripStoryText, previewMediaLink } from '../../services/tripStoryService';
import './LeaveTripStoryModal.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LeaveTripStoryModal = ({ tripId, defaultPlaceName, defaultCity, onClose, onCreated }) => {
  const [placeName, setPlaceName] = useState(defaultPlaceName || '');
  const [city, setCity] = useState(defaultCity || '');
  const [text, setText] = useState('');
  const [sourceType, setSourceType] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
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
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setIsTranscribing(true);
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const res = await fetch(`${API_BASE}/api/voice/transcribe`, { method: 'POST', body: formData });
          const data = await res.json();
          if (data.text) {
            setText((prev) => (prev ? `${prev} ${data.text}` : data.text));
            setSourceType('voice');
          } else {
            toast.error('Could not understand audio.');
          }
        } catch {
          toast.error('Transcription failed.');
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRefine = async (mode) => {
    if (!text.trim()) return;
    setIsRefining(true);
    try {
      const res = await refineTripStoryText(text, mode);
      if (res?.success) setText(res.data.text);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCheckLink = async () => {
    if (!mediaUrl.trim()) return;
    setIsCheckingLink(true);
    try {
      const res = await previewMediaLink(mediaUrl.trim());
      if (res?.success) setMediaPreview(res.data);
    } finally {
      setIsCheckingLink(false);
    }
  };

  const handleSubmit = async () => {
    if (!placeName.trim()) { toast.error('Where was this?'); return; }
    if (!text.trim()) { toast.error('Add a quick tip or note.'); return; }

    setIsSubmitting(true);
    try {
      const res = await createTripStoryEntry({
        trip_id: tripId || null,
        location: { name: placeName.trim(), city: city.trim() || undefined },
        text: text.trim(),
        sourceType,
        mediaLinks: mediaUrl.trim() ? [{ url: mediaUrl.trim() }] : []
      });
      if (res?.success) {
        toast.success('Tip added to the map!');
        onCreated?.(res.data.entry);
        onClose();
      } else {
        toast.error('Could not save your tip.');
      }
    } catch {
      toast.error('Could not save your tip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lts-overlay" onClick={onClose}>
      <div className="lts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lts-header">
          <h3>Leave a travel tip</h3>
          <button className="lts-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="lts-body">
          <div className="lts-row">
            <div className="lts-field">
              <label>Place</label>
              <input type="text" value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="e.g. Trastevere neighborhood" />
            </div>
            <div className="lts-field">
              <label>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Rome" />
            </div>
          </div>

          <div className="lts-field">
            <div className="lts-textarea-head">
              <label>Your tip</label>
              <button
                type="button"
                className={`lts-mic-btn${isRecording ? ' lts-mic-btn--recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
              >
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                {isRecording ? 'Stop' : isTranscribing ? 'Transcribing…' : 'Record instead'}
              </button>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='"This beach is beautiful in the morning but very crowded in the afternoon."'
            />
            <div className="lts-refine-row">
              <button type="button" onClick={() => handleRefine('fix_grammar')} disabled={isRefining || !text.trim()}>Fix grammar</button>
              <button type="button" onClick={() => handleRefine('improve_style')} disabled={isRefining || !text.trim()}>Improve writing</button>
            </div>
          </div>

          <div className="lts-field">
            <label>Add a photo or video link <span className="lts-optional">(optional)</span></label>
            <div className="lts-link-row">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => { setMediaUrl(e.target.value); setMediaPreview(null); }}
                onBlur={handleCheckLink}
                placeholder="Paste an Instagram, YouTube, or TikTok link"
              />
              {isCheckingLink && <span className="lts-link-checking">Checking…</span>}
            </div>
            {mediaPreview?.previewTitle && (
              <div className="lts-media-preview">
                {mediaPreview.previewThumbnail && <img src={mediaPreview.previewThumbnail} alt="" />}
                <span>{mediaPreview.previewTitle}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lts-footer">
          <button className="lts-btn lts-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="lts-btn lts-btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Post to map'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTripStoryModal;
