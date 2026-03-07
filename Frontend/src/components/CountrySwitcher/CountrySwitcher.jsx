import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import '../CurrencySwitcher/CurrencySwitcher.css'; // shared styles

const CountrySwitcher = () => {
  const { country, setCountry, COUNTRIES } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchRef  = useRef(null);

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  useEffect(() => {
    if (!isOpen) { setSearch(''); return; }
    setTimeout(() => searchRef.current?.focus(), 50);

    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const handleSelect = (c) => { setCountry(c); setIsOpen(false); };

  return (
    <div className="footer-select-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="footer-select-btn"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        title="Country"
      >
        <span className="footer-select-icon">{country.flag}</span>
        <span className="footer-select-label">
          <span className="footer-select-sub">Country</span>
          <span className="footer-select-value">{country.name}</span>
        </span>
        <svg className={`footer-select-arrow${isOpen ? ' open' : ''}`} width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 9L1 4h10z" fill="currentColor"/>
        </svg>
      </button>

      {isOpen && (
        <div className="footer-select-dropdown">
          <div className="footer-select-search">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="footer-select-list">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                className={`footer-select-option${c.code === country.code ? ' active' : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className="footer-select-option-flag">{c.flag}</span>
                <span className="footer-select-option-code">{c.code}</span>
                <span className="footer-select-option-name">{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="footer-select-empty">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySwitcher;
