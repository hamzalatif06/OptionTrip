import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY  = 'optiontrip_theme';
const ACCENT_STORAGE_KEY = 'optiontrip_accent';

export const ACCENT_OPTIONS = [
  { id: 'teal',   label: 'Teal',   swatch: '#029e9d' },
  { id: 'blue',   label: 'Blue',   swatch: '#2563eb' },
  { id: 'green',  label: 'Green',  swatch: '#16a34a' },
  { id: 'red',    label: 'Red',    swatch: '#e11d48' },
  { id: 'orange', label: 'Orange', swatch: '#ea580c' },
  { id: 'yellow', label: 'Yellow', swatch: '#ca8a04' },
  { id: 'purple', label: 'Purple', swatch: '#7c3aed' },
];

const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

const applyAccent = (accent) => {
  if (accent && accent !== 'teal') {
    document.documentElement.setAttribute('data-accent', accent);
  } else {
    document.documentElement.removeAttribute('data-accent');
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'dark';
  });
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem(ACCENT_STORAGE_KEY) || 'teal';
  });

  useEffect(() => {
    applyTheme(isDark);
    applyAccent(accent);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    applyTheme(next);
  };

  const changeAccent = (nextAccent) => {
    setAccent(nextAccent);
    localStorage.setItem(ACCENT_STORAGE_KEY, nextAccent);
    applyAccent(nextAccent);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, accent, changeAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
