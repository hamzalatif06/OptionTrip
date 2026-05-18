import React, { useRef, useState } from 'react';
import './MapBottomSheet.css';

const STATUS_COLORS = {
  confirmed: '#22c55e',
  itinerary_generated: '#3b82f6',
  option_selected: '#f59e0b',
  options_generated: '#8b5cf6',
  draft: '#94a3b8',
  archived: '#ef4444',
};

const MapBottomSheet = ({
  item = null,
  state = 'closed',
  onStateChange,
  onClose,
  onViewFull,
}) => {
  const startYRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e) => {
    startYRef.current = (e.touches?.[0] || e).clientY;
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragging || startYRef.current === null) return;
    const dy = (e.touches?.[0] || e).clientY - startYRef.current;
    if (dy < -40) {
      onStateChange?.('open');
      setDragging(false);
    } else if (dy > 40) {
      onStateChange?.(state === 'open' ? 'peek' : 'closed');
      setDragging(false);
    }
  };

  const handlePointerUp = () => setDragging(false);

  const toggleExpand = () =>
    onStateChange?.(state === 'open' ? 'peek' : 'open');

  if (!item) return null;

  const sc = STATUS_COLORS[item.status] || '#94a3b8';

  return (
    <div className={`mbs-wrap mbs-wrap--${state}`}>
      <div
        className="mbs-sheet"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Drag handle */}
        <div className="mbs-handle-wrap" onClick={toggleExpand}>
          <div className="mbs-handle" />
        </div>

        {/* Header – always visible */}
        <div className="mbs-header">
          <div className="mbs-header__info">
            <h3 className="mbs-title">{item.title}</h3>
            {item.subtitle && (
              <p className="mbs-subtitle">{item.subtitle}</p>
            )}
          </div>
          <div className="mbs-header__actions">
            {item.status && (
              <span
                className="mbs-status-badge"
                style={{ background: sc + '22', color: sc }}
              >
                {item.status.replace(/_/g, ' ')}
              </span>
            )}
            <button className="mbs-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body – expanded only */}
        <div className="mbs-body">
          {/* Stats */}
          {item.meta && item.meta.length > 0 && (
            <div className="mbs-stats">
              {item.meta.map((m, i) => (
                <div key={i} className="mbs-stat">
                  {m.icon && <span className="mbs-stat__icon">{m.icon}</span>}
                  <span className="mbs-stat__label">{m.label}</span>
                  <span className="mbs-stat__val">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="mbs-desc">{item.description}</p>
          )}

          {/* Activities chips */}
          {item.activities && item.activities.length > 0 && (
            <>
              <p className="mbs-acts-title">Activities</p>
              <div className="mbs-acts-list">
                {item.activities.slice(0, 5).map((a, i) => (
                  <span key={i} className="mbs-act-chip">
                    {a.title || a.name}
                  </span>
                ))}
                {item.activities.length > 5 && (
                  <span className="mbs-act-chip mbs-act-chip--more">
                    +{item.activities.length - 5} more
                  </span>
                )}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="mbs-actions">
            {item.tripId && (
              <button
                className="mbs-btn mbs-btn--primary"
                onClick={() => onViewFull?.(item)}
              >
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                View Full Trip
              </button>
            )}
            <button className="mbs-btn mbs-btn--ghost">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path
                  d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapBottomSheet;
