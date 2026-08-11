import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageMeta from '../hooks/usePageMeta';
import { logActivity } from '../services/activityService';
import {
  readLocalNationality,
  writeLocalNationality,
  fetchPassports,
  fetchDestinations,
  fetchDestinationDetail,
  savePassportToProfile
} from '../services/whereCanIGoService';
import './WhereCanIGo.css';

const ENTRY_BADGES = {
  visa_free:       { label: 'Visa-free',      icon: 'fa-check-circle', tone: 'wcig-badge--good' },
  visa_on_arrival: { label: 'Visa on arrival', icon: 'fa-plane-arrival', tone: 'wcig-badge--ok'   },
  e_visa:          { label: 'e-Visa',         icon: 'fa-envelope-open-text', tone: 'wcig-badge--info' },
  embassy_visa:    { label: 'Embassy visa',   icon: 'fa-building-columns',   tone: 'wcig-badge--hard' }
};

const COMFORT_META = {
  halal:        { label: 'Halal food',       icon: 'fa-utensils' },
  prayer:       { label: 'Prayer-friendly',   icon: 'fa-mosque' },
  conservative: { label: 'Family/modest',     icon: 'fa-people-roof' },
  women_solo:   { label: 'Solo-woman safe',   icon: 'fa-person-dress' }
};

const ScoreBadge = ({ score, bucket }) => (
  <div className={`wcig-score wcig-score--${bucket}`} title="Easy-to-Go score">
    <span className="wcig-score__num">{score}</span>
    <span className="wcig-score__slash">/</span>
    <span className="wcig-score__den">10</span>
  </div>
);

const EntryBadge = ({ entry }) => {
  const b = ENTRY_BADGES[entry] || ENTRY_BADGES.embassy_visa;
  return (
    <span className={`wcig-badge ${b.tone}`}>
      <i className={`fas ${b.icon}`} />
      {b.label}
    </span>
  );
};

const ComfortIcons = ({ comfort }) => (
  <div className="wcig-comfort-row">
    {Object.entries(COMFORT_META).map(([key, meta]) => (
      <span
        key={key}
        className={`wcig-comfort-chip${comfort?.[key] ? ' wcig-comfort-chip--on' : ''}`}
        title={`${meta.label}: ${comfort?.[key] ? 'yes' : 'limited'}`}
      >
        <i className={`fas ${meta.icon}`} />
      </span>
    ))}
  </div>
);

const formatVerified = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PassportPicker = ({ passports, onPick, current }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return passports;
    return passports.filter(p =>
      p.name.toLowerCase().includes(t) || p.code.toLowerCase().includes(t)
    );
  }, [q, passports]);

  return (
    <div className="wcig-picker">
      <div className="wcig-picker__header">
        <div className="wcig-picker__emoji">🛂</div>
        <h2>Which passport do you travel on?</h2>
        <p>We use this to show only the destinations you can actually go to — with the exact entry requirement labeled up front.</p>
      </div>
      <input
        type="text"
        className="wcig-picker__search"
        placeholder="Search a country…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="wcig-picker__grid">
        {filtered.map(p => (
          <button
            key={p.code}
            type="button"
            className={`wcig-passport${current === p.code ? ' wcig-passport--active' : ''}`}
            onClick={() => onPick(p.code)}
          >
            <span className="wcig-passport__flag">{p.flag}</span>
            <span className="wcig-passport__name">{p.name}</span>
            <span className="wcig-passport__code">{p.code}</span>
          </button>
        ))}
        {!filtered.length && (
          <div className="wcig-picker__empty">No matching passport — try another spelling.</div>
        )}
      </div>
      <p className="wcig-picker__note">
        Stored just for you — you can change this anytime from the top of the page.
      </p>
    </div>
  );
};

const DestinationCard = ({ dest, onOpen }) => (
  <button type="button" className="wcig-card" onClick={() => onOpen(dest)}>
    <div className="wcig-card__hero">
      {dest.hero && (
        <img
          className="wcig-card__hero-img"
          src={dest.hero}
          alt={dest.name}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <ScoreBadge score={dest.easy_score} bucket={dest.easy_bucket} />
      {dest.changed_recently && (
        <span className="wcig-card__flag" title="Recently changed — verify before booking">
          <i className="fas fa-triangle-exclamation" /> Verify
        </span>
      )}
    </div>
    <div className="wcig-card__body">
      <div className="wcig-card__title-row">
        <span className="wcig-card__flag-emoji">{dest.flag}</span>
        <h3 className="wcig-card__name">{dest.name}</h3>
      </div>
      <p className="wcig-card__pitch">{dest.pitch}</p>
      <div className="wcig-card__meta">
        <EntryBadge entry={dest.entry} />
        {typeof dest.transit_hrs === 'number' && (
          <span className="wcig-card__transit">
            <i className="fas fa-plane" /> ~{dest.transit_hrs}h flight
          </span>
        )}
      </div>
      <ComfortIcons comfort={dest.comfort} />
      <div className="wcig-card__foot">
        <span>Verified {formatVerified(dest.last_verified)}</span>
        <span className="wcig-card__cta">Details <i className="fas fa-arrow-right" /></span>
      </div>
    </div>
  </button>
);

const DetailModal = ({ detail, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!detail) return null;
  const { destination: d, entry, easy_score, easy_bucket, transit_hrs, passport } = detail;

  const processingLabel = entry.processing_days === 0
    ? 'On the spot / instant'
    : `~${entry.processing_days} day${entry.processing_days === 1 ? '' : 's'}`;

  return (
    <div className="wcig-modal" onClick={onClose}>
      <div className="wcig-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="wcig-modal__close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        <div className="wcig-modal__hero">
          {d.hero && (
            <img
              className="wcig-modal__hero-img"
              src={d.hero}
              alt={d.name}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="wcig-modal__hero-overlay">
            <div className="wcig-modal__hero-titleblock">
              <span className="wcig-modal__flag">{d.flag}</span>
              <div>
                <h2 className="wcig-modal__name">{d.name}</h2>
                <span className="wcig-modal__region">{d.region}</span>
              </div>
            </div>
            <ScoreBadge score={easy_score} bucket={easy_bucket} />
          </div>
        </div>

        <div className="wcig-modal__body">
          <p className="wcig-modal__pitch">{d.pitch}</p>

          {entry.changed_recently && (
            <div className="wcig-alert">
              <i className="fas fa-triangle-exclamation" />
              <div>
                <strong>Verify before booking.</strong> This rule was updated recently — always confirm on the official portal or with the embassy of {d.name}.
              </div>
            </div>
          )}

          <div className="wcig-modal__grid">
            <div className="wcig-modal__stat">
              <span className="wcig-modal__stat-label">For your passport</span>
              <div className="wcig-modal__stat-value">
                <span>{passport?.flag}</span>
                <strong>{passport?.name}</strong>
              </div>
            </div>
            <div className="wcig-modal__stat">
              <span className="wcig-modal__stat-label">Entry type</span>
              <div className="wcig-modal__stat-value"><EntryBadge entry={entry.type} /></div>
            </div>
            <div className="wcig-modal__stat">
              <span className="wcig-modal__stat-label">Processing time</span>
              <div className="wcig-modal__stat-value"><strong>{processingLabel}</strong></div>
            </div>
            <div className="wcig-modal__stat">
              <span className="wcig-modal__stat-label">Allowed stay</span>
              <div className="wcig-modal__stat-value"><strong>{entry.stay_days} days</strong></div>
            </div>
            {typeof transit_hrs === 'number' && (
              <div className="wcig-modal__stat">
                <span className="wcig-modal__stat-label">Typical flight time</span>
                <div className="wcig-modal__stat-value"><strong>~{transit_hrs}h</strong></div>
              </div>
            )}
          </div>

          <div className="wcig-modal__section">
            <h4>Documents typically required</h4>
            <ul className="wcig-doc-list">
              {(entry.documents || []).map((doc, i) => (
                <li key={i}><i className="fas fa-check" /> {doc}</li>
              ))}
              {!entry.documents?.length && <li className="wcig-muted">Nothing beyond a valid passport.</li>}
            </ul>
          </div>

          <div className="wcig-modal__section">
            <h4>Comfort details</h4>
            <div className="wcig-modal__comfort">
              {Object.entries(COMFORT_META).map(([key, meta]) => (
                <div key={key} className={`wcig-comfort-item${d.comfort?.[key] ? ' wcig-comfort-item--on' : ''}`}>
                  <i className={`fas ${meta.icon}`} />
                  <div>
                    <strong>{meta.label}</strong>
                    <span>{d.comfort?.[key] ? 'Widely available / friendly' : 'Limited or requires planning'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="wcig-modal__verified">
            <i className="fas fa-shield-halved" />
            Info last verified {formatVerified(entry.last_verified)}. Visa policies can change — always check the official portal before booking.
          </p>

          {entry.notes && (
            <p className="wcig-modal__notes">
              <i className="fas fa-circle-info" /> {entry.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const WhereCanIGo = () => {
  const { user, isAuthenticated } = useAuth();

  const [passports,    setPassports]    = useState([]);
  const [nationality,  setNationality]  = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const [hideEmbassy, setHideEmbassy] = useState(false);
  const [comfort,     setComfort]     = useState({
    halal: false, prayer: false, conservative: false, women_solo: false
  });
  const [sortBy, setSortBy] = useState('easy');

  const [pickerOpen, setPickerOpen] = useState(false);

  const [detail,      setDetail]      = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPassports().then(setPassports).catch(err => {
      console.error(err);
      setError('Could not load passports. Try again in a bit.');
    });
  }, []);

  useEffect(() => {
    const fromProfile = user?.nationality;
    const fromLocal   = readLocalNationality();
    setNationality(fromProfile || fromLocal || null);
  }, [user?.nationality]);

  const loadDestinations = useCallback(async () => {
    if (!nationality) { setDestinations([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDestinations(nationality, { hideEmbassy, comfort, sortBy });
      setDestinations(res.destinations || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  }, [nationality, hideEmbassy, comfort, sortBy]);

  useEffect(() => { loadDestinations(); }, [loadDestinations]);

  const handlePickNationality = async (code) => {
    setNationality(code);
    writeLocalNationality(code);
    setPickerOpen(false);
    if (isAuthenticated) {
      savePassportToProfile(code).catch(() => {});
      logActivity({
        type: 'destination',
        action: 'passport_set',
        title: `Set travel passport to ${code}`,
        metadata: { nationality: code }
      });
    }
  };

  const handleOpenDetail = async (dest) => {
    setDetailLoading(true);
    setDetail({ __loading: true });
    try {
      const full = await fetchDestinationDetail(nationality, dest.code);
      setDetail(full);
      logActivity({
        type: 'destination',
        action: 'viewed',
        title: `Viewed entry requirements for ${dest.name}`,
        metadata: { destination: dest.name, code: dest.code, entry: dest.entry, passport: nationality }
      });
    } catch (err) {
      console.error(err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const currentPassport = passports.find(p => p.code === nationality) || null;
  const showingPicker   = !nationality || pickerOpen;

  const anyComfortOn = Object.values(comfort).some(Boolean);
  const activeFilterCount =
    (hideEmbassy ? 1 : 0) + Object.values(comfort).filter(Boolean).length;

  const toggleComfort = (key) => setComfort(prev => ({ ...prev, [key]: !prev[key] }));
  const clearFilters  = () => {
    setHideEmbassy(false);
    setComfort({ halal: false, prayer: false, conservative: false, women_solo: false });
  };

  const oldestVerified = destinations.reduce((acc, d) => {
    if (!d.last_verified) return acc;
    if (!acc || new Date(d.last_verified) < new Date(acc)) return d.last_verified;
    return acc;
  }, null);

  return (
    <div className="wcig-page">
      <PageMeta
        title="Where Can I Go? — Visa-Free Travel Discovery"
        description="Tell us your passport, we show you where you can travel — visa-free, visa-on-arrival, e-visa, and embassy visa destinations, ranked by our Easy-to-Go score with halal, prayer, and solo-woman comfort filters."
        keywords="visa requirements, visa free countries, where can I travel, visa on arrival, e-visa, passport travel, halal travel, muslim friendly destinations"
        path="/where-can-i-go"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Where Can I Go?',
          description: 'Passport-first travel discovery — see every country you can visit with your passport, ranked by real-trip hassle (visa type, processing, docs, transit).',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Web',
          url: 'https://www.optiontrip.com/where-can-i-go',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        }}
      />

      <section className="wcig-hero">
        <div className="container">
          <div className="wcig-hero__badge">🌍 Discovery</div>
          <h1 className="wcig-hero__title">Where Can I Go?</h1>
          <p className="wcig-hero__sub">
            Tell us your passport once — we'll show you the destinations you can actually travel to, ranked by how easy the trip really is.
          </p>
        </div>
      </section>

      <div className="container wcig-body">
        {showingPicker ? (
          <PassportPicker
            passports={passports}
            onPick={handlePickNationality}
            current={nationality}
          />
        ) : (
          <>

            <div className="wcig-toolbar">
              <div className="wcig-passport-chip">
                <span className="wcig-passport-chip__flag">{currentPassport?.flag || '🛂'}</span>
                <div className="wcig-passport-chip__body">
                  <span className="wcig-passport-chip__label">Travelling on</span>
                  <strong>{currentPassport?.name || nationality} passport</strong>
                </div>
                <button
                  type="button"
                  className="wcig-passport-chip__change"
                  onClick={() => setPickerOpen(true)}
                >
                  <i className="fas fa-shuffle" /> Change
                </button>
              </div>

              <div className="wcig-toolbar__actions">
                <label className="wcig-toggle">
                  <input
                    type="checkbox"
                    checked={hideEmbassy}
                    onChange={(e) => setHideEmbassy(e.target.checked)}
                  />
                  <span className="wcig-toggle__thumb" />
                  <span className="wcig-toggle__label">Hide embassy-visa destinations</span>
                </label>

                <div className="wcig-sort">
                  <label htmlFor="wcig-sort-select">Sort by</label>
                  <select
                    id="wcig-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="easy">Easy-to-Go score</option>
                    <option value="alpha">Country name (A-Z)</option>
                    <option value="transit">Flight time</option>
                  </select>
                </div>
              </div>
            </div>


            <div className="wcig-comfort-filters">
              <div className="wcig-comfort-filters__label">
                <i className="fas fa-heart" /> Comfort filters
              </div>
              <div className="wcig-comfort-filters__chips">
                {Object.entries(COMFORT_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    className={`wcig-filter-chip${comfort[key] ? ' wcig-filter-chip--on' : ''}`}
                    onClick={() => toggleComfort(key)}
                  >
                    <i className={`fas ${meta.icon}`} />
                    {meta.label}
                    {comfort[key] && <i className="fas fa-check wcig-filter-chip__check" />}
                  </button>
                ))}
                {activeFilterCount > 0 && (
                  <button type="button" className="wcig-filter-clear" onClick={clearFilters}>
                    <i className="fas fa-xmark" /> Clear ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>


            {oldestVerified && (
              <div className="wcig-freshness">
                <i className="fas fa-clock-rotate-left" />
                Visa rules on this page verified between {formatVerified(oldestVerified)} and {formatVerified(new Date().toISOString())}. Always confirm before booking.
              </div>
            )}


            {loading ? (
              <div className="wcig-loader">
                <div className="wcig-loader__spinner" />
                <span>Checking where you can go…</span>
              </div>
            ) : error ? (
              <div className="wcig-error">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            ) : destinations.length === 0 ? (
              <div className="wcig-empty">
                <div className="wcig-empty__emoji">🧭</div>
                <h3>No destinations match those filters</h3>
                <p>Try turning off a comfort toggle or the embassy-visa hide, and we'll show more.</p>
                <button className="wcig-btn wcig-btn--secondary" onClick={clearFilters}>Reset filters</button>
              </div>
            ) : (
              <>
                <div className="wcig-results-summary">
                  <strong>{destinations.length}</strong> destination{destinations.length === 1 ? '' : 's'} available
                  {anyComfortOn && ' matching your comfort needs'}.
                </div>
                <div className="wcig-grid">
                  {destinations.map(d => (
                    <DestinationCard key={d.code} dest={d} onOpen={handleOpenDetail} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>


      {detail && !detail.__loading && (
        <DetailModal detail={detail} onClose={() => setDetail(null)} />
      )}
      {detailLoading && detail?.__loading && (
        <div className="wcig-modal" onClick={() => setDetail(null)}>
          <div className="wcig-modal__card wcig-modal__card--loading">
            <div className="wcig-loader__spinner" />
            <p>Loading entry details…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhereCanIGo;
