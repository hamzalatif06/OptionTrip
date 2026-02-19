import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Language names always in English, regardless of current language
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Russian' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'it', name: 'Italian' },
    { code: 'es', name: 'Spanish' },
    { code: 'pl', name: 'Polish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'sr', name: 'Serbian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'ko', name: 'Korean' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'id', name: 'Indonesian' },
  ];

  const currentLanguage = languages.find(lang => lang.code === (i18n.language || 'en')) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Adjust dropdown position to prevent overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current.querySelector('.language-dropdown-menu');
      if (dropdown) {
        const rect = dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If dropdown goes below viewport, flip it above
        if (spaceBelow < 100 && spaceAbove > spaceBelow) {
          dropdown.style.top = 'auto';
          dropdown.style.bottom = '100%';
          dropdown.style.marginBottom = '5px';
          dropdown.style.marginTop = '0';
        } else {
          dropdown.style.top = '100%';
          dropdown.style.bottom = 'auto';
          dropdown.style.marginTop = '5px';
          dropdown.style.marginBottom = '0';
        }
      }
    }
  }, [isOpen]);

  return (
    <div className="language-switcher-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="language-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.language')}
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.name}</span>
        <svg
          className={`language-switcher-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9L1 4h10z" fill="currentColor" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="language-dropdown-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
