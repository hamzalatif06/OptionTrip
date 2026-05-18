import React, { useRef, useEffect, useState } from 'react';
import './MapTimeline.css';

const MapTimeline = ({
  mode = 'travel',
  items = [],
  activeId,
  onSelect,
  isOpen = true,
  onToggle,
}) => {
  const [search, setSearch] = useState('');
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  const visible = search
    ? items.filter((it) =>
        (it.title || '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <>
      <button
        className="mti-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close timeline' : 'Open timeline'}
      >
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
          {isOpen ? (
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      <aside className={`mti-panel${isOpen ? ' mti-panel--open' : ''}`}>
        {/* Header */}
        <div className="mti-header">
          <div className="mti-header__icon">
            <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
              <path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="mti-header__title">
            {mode === 'travel' ? 'My Trips' : 'Trip Timeline'}
          </h2>
          <span className="mti-count">{visible.length}</span>
        </div>

        {/* Search */}
        {items.length > 4 && (
          <div className="mti-search">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16.5 16.5l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder={mode === 'travel' ? 'Search destination…' : 'Search day…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* List */}
        <div className="mti-list">
          {visible.length === 0 ? (
            <div className="mti-empty">
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p>{mode === 'travel' ? 'No trips yet' : 'No days available'}</p>
            </div>
          ) : (
            visible.map((item, i) => {
              const isActive = String(item.id) === String(activeId);
              return (
                <button
                  key={item.id}
                  ref={isActive ? activeRef : null}
                  className={`mti-item${isActive ? ' mti-item--active' : ''}`}
                  onClick={() => onSelect?.(item)}
                >
                  <div className="mti-item__track">
                    <div
                      className={`mti-item__dot${isActive ? ' mti-item__dot--active' : ''}`}
                    />
                    {i < visible.length - 1 && <div className="mti-item__line" />}
                  </div>

                  <div className="mti-item__content">
                    <div className="mti-item__top">
                      {item.icon && (
                        <span className="mti-item__icon">{item.icon}</span>
                      )}
                      <span className="mti-item__title">
                        {item.title || `Item ${i + 1}`}
                      </span>
                      {item.status && (
                        <span
                          className="mti-item__badge"
                          style={{
                            background: (item.statusColor || '#029e9d') + '22',
                            color: item.statusColor || '#029e9d',
                          }}
                        >
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="mti-item__sub">{item.subtitle}</p>
                    )}
                    {item.meta && item.meta.length > 0 && (
                      <div className="mti-item__meta">
                        {item.meta.map((m, mi) => (
                          <span key={mi} className="mti-item__chip">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    width="14"
                    height="14"
                    className="mti-item__arrow"
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default MapTimeline;
