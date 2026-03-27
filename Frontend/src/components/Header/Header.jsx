import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇬🇧' },
  { code: 'fr', name: 'Français',   flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { code: 'es', name: 'Español',    flag: '🇪🇸' },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt', name: 'Português',  flag: '🇵🇹' },
  { code: 'ru', name: 'Русский',    flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe',     flag: '🇹🇷' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা',       flag: '🇧🇩' },
  { code: 'zh', name: '中文',        flag: '🇨🇳' },
  { code: 'ja', name: '日本語',      flag: '🇯🇵' },
  { code: 'ko', name: '한국어',      flag: '🇰🇷' },
  { code: 'id', name: 'Indonesia',  flag: '🇮🇩' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย',    flag: '🇹🇭' },
  { code: 'hu', name: 'Magyar',     flag: '🇭🇺' },
  { code: 'sv', name: 'Svenska',    flag: '🇸🇪' },
  { code: 'sr', name: 'Srpski',     flag: '🇷🇸' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen]           = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);

  const [isLangOpen, setIsLangOpen]           = useState(false);
  const [userLocation, setUserLocation]       = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const location  = useLocation();
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const [langDropdownPos, setLangDropdownPos] = useState({ top: 0, right: 0 });

  const closeTimeout = useRef(null);
  const langRef      = useRef(null);
  const langBtnRef   = useRef(null);

  // ── Location ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLocation = async () => {
      const cachedLocation = localStorage.getItem('userLocation');
      const cachedTime     = localStorage.getItem('userLocationTime');
      if (cachedLocation && cachedTime) {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (parseInt(cachedTime) > hourAgo) {
          setUserLocation(cachedLocation);
          setIsLoadingLocation(false);
          return;
        }
      }
      if ('geolocation' in navigator) {
        try {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                  { headers: { 'Accept-Language': i18n.language || 'en' } }
                );
                if (response.ok) {
                  const data = await response.json();
                  const city    = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
                  const country = data.address?.country || '';
                  const locationString = city && country ? `${city}, ${country}` : city || country || t('header.location');
                  setUserLocation(locationString);
                  localStorage.setItem('userLocation', locationString);
                  localStorage.setItem('userLocationTime', Date.now().toString());
                }
              } catch { setUserLocation(t('header.location')); }
              setIsLoadingLocation(false);
            },
            () => { setUserLocation(t('header.location')); setIsLoadingLocation(false); },
            { timeout: 10000, maximumAge: 300000 }
          );
        } catch { setUserLocation(t('header.location')); setIsLoadingLocation(false); }
      } else {
        setUserLocation(t('header.location'));
        setIsLoadingLocation(false);
      }
    };
    fetchLocation();
  }, [t, i18n.language]);

  // ── Close lang dropdown on outside click ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const clickedBtn = langBtnRef.current?.contains(e.target);
      const clickedDropdown = langRef.current?.contains(e.target);
      if (!clickedBtn && !clickedDropdown) setIsLangOpen(false);
    };
    if (isLangOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isLangOpen]);

  // ── Auth dropdown helpers ─────────────────────────────────────────
  const toggleMenu          = () => setIsMenuOpen((v) => !v);
  const toggleAuthDropdown  = () => setIsAuthDropdownOpen((v) => !v);
  const openAuthDropdown    = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(true); };
  const closeAuthDropdown   = () => { closeTimeout.current = setTimeout(() => setIsAuthDropdownOpen(false), 150); };
  const closeAuthDropdownImmediately = () => { clearTimeout(closeTimeout.current); setIsAuthDropdownOpen(false); };


  const handleLogout = async () => {
    try { await logout(); closeAuthDropdownImmediately(); navigate('/'); }
    catch (e) { console.error('Logout error:', e); }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // ── Language change ───────────────────────────────────────────────
  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  const openLangDropdown = () => {
    if (langBtnRef.current) {
      const rect = langBtnRef.current.getBoundingClientRect();
      setLangDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setIsLangOpen((v) => !v);
  };

  const currentLang = LANGUAGES.find((l) => l.code === (i18n.language?.split('-')[0] || 'en')) || LANGUAGES[0];

  // ── Date ─────────────────────────────────────────────────────────
  const formatDate = () => {
    const date = new Date();
    try {
      return date.toLocaleDateString(i18n.language || 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <header className="main_header_area">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="header-content py-1 bg-theme">
        <div className="container d-flex align-items-center justify-content-between">

          {/* Left: date + location */}
          <div className="links">
            <ul>
              <li>
                <a href="#" className="white">
                  <i className="icon-calendar white"></i> {formatDate()}
                </a>
              </li>
              <li>
                <a href="#" className="white location-display">
                  <i className="icon-location-pin white"></i>
                  {isLoadingLocation
                    ? <span className="location-loading">{t('header.detectingLocation') || 'Detecting...'}</span>
                    : <span>{userLocation || t('header.location')}</span>}
                </a>
              </li>
            </ul>
          </div>

          {/* Right: social icons + language switcher */}
          <div className="header-right d-flex align-items-center gap-2">
            <ul className="header-social-list">
              <li>
                <a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-facebook"></i>
                </a>
              </li>
              <li>
                <a href="https://x.com/OptionTripCom" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-twitter"></i>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-instagram"></i>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@optiontrip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-youtube"></i>
                </a>
              </li>
            </ul>

            {/* Language Switcher */}
            <div className="header-lang">
              <button ref={langBtnRef} className="header-lang__toggle" onClick={openLangDropdown} aria-label="Change language">
                <i className="fa fa-globe"></i>
                <span className="header-lang__flag">{currentLang.flag}</span>
                <span className="header-lang__code">{currentLang.code.toUpperCase()}</span>
                <i className={`icon-arrow-down header-lang__arrow ${isLangOpen ? 'open' : ''}`}></i>
              </button>

              {isLangOpen && createPortal(
                <div
                  className="header-lang__dropdown"
                  style={{ top: langDropdownPos.top, right: langDropdownPos.right }}
                  ref={langRef}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      className={`header-lang__option ${lang.code === currentLang.code ? 'active' : ''}`}
                      onClick={() => handleLangChange(lang.code)}
                    >
                      <span className="header-lang__option-flag">{lang.flag}</span>
                      <span className="header-lang__option-name">{lang.name}</span>
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav ─────────────────────────────────────────────── */}
      <div className="header_menu" id="header_menu">
        <nav className="navbar navbar-default">
          <div className="container">
            <div className="navbar-flex d-flex align-items-center justify-content-between w-100 pb-3 pt-3">
              <div className="navbar-header">
                <Link className="navbar-brand" to="/">
                  <img src="/images/newLogo.png" alt="OptionTrip" style={{ height: '70px' }} />
                </Link>
              </div>

              <div className={`navbar-collapse1 d-flex align-items-center ${isMenuOpen ? 'show' : ''}`}>
                <ul className="nav navbar-nav" id="responsive-menu">
                  <li className={`dropdown submenu ${isActive('/')}`}>
                    <Link to="/" className="dropdown-toggle">{t('common.home')}</Link>
                  </li>
                  <li className={isActive('/about')}>
                    <Link to="/about">{t('common.about')}</Link>
                  </li>
                  <li className={`dropdown submenu ${isActive('/destinations')}`}>
                    <Link to="/destinations" className="dropdown-toggle">{t('common.destinations')}</Link>
                  </li>
                  <li className={`dropdown submenu ${isActive('/tours')}`}>
                    <Link to="/tours" className="dropdown-toggle">{t('common.tours')}</Link>
                  </li>
                  <li className="dropdown submenu">
                    <a href="#bookings" className="dropdown-toggle" onClick={(e) => e.preventDefault()}>
                      Bookings
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link to="/flights"><i className="fa fa-plane"></i> Flights</Link>
                      </li>
                      <li>
                        <Link to="/hotels"><i className="fa fa-building"></i> Hotels</Link>
                      </li>
                    </ul>
                  </li>
                  <li className={`dropdown submenu ${isActive('/blog')}`}>
                    <a href="https://blog.optiontrip.com" target="_blank" rel="noopener noreferrer" className="dropdown-toggle">
                      {t('common.blog')}
                    </a>
                  </li>
                  <li className="search-main">
                    <a href="#search1" className="mt_search"><i className="fa fa-search"></i></a>
                  </li>
                </ul>
              </div>

              <div className="register-login d-flex align-items-center gap-3">
                <div className="auth-dropdown-wrapper" onMouseEnter={openAuthDropdown} onMouseLeave={closeAuthDropdown}>
                  <button className="auth-dropdown-toggle" onClick={toggleAuthDropdown}>
                    {isAuthenticated ? (
                      <>
                        <div className="profile-icon">
                          {user?.profileImage
                            ? <img src={user.profileImage} alt={user.name} />
                            : <i className="icon-user"></i>}
                        </div>
                        <span>{user?.name || 'Profile'}</span>
                        <i className={`icon-arrow-down dropdown-arrow ${isAuthDropdownOpen ? 'open' : ''}`}></i>
                      </>
                    ) : (
                      <>
                        <i className="icon-user"></i>
                        <span>Account</span>
                        <i className={`icon-arrow-down dropdown-arrow ${isAuthDropdownOpen ? 'open' : ''}`}></i>
                      </>
                    )}
                  </button>

                  {isAuthDropdownOpen && (
                    <div className="auth-dropdown-menu">
                      {isAuthenticated ? (
                        <>
                          <Link to="/profile" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>
                            <i className="icon-user"></i><span>My Profile</span>
                          </Link>
                          <Link to="/my-trips" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>
                            <i className="icon-compass"></i><span>My Trips</span>
                          </Link>
                          <div className="dropdown-divider"></div>
                          <button className="auth-dropdown-item logout-item" onClick={handleLogout}>
                            <i className="icon-logout"></i><span>Logout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>
                            <i className="icon-login"></i><span>Login</span>
                          </Link>
                          <Link to="/signup" className="auth-dropdown-item" onClick={closeAuthDropdownImmediately}>
                            <i className="icon-user-add"></i><span>Sign Up</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Link to="/contact" className="nir-btn white">{t('common.contact')}</Link>
              </div>

              {/* Hamburger */}
              <button className={`hamburger ${isMenuOpen ? 'hamburger--open' : ''}`} onClick={toggleMenu} aria-label="Toggle menu">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}

      {/* ── Side Drawer ──────────────────────────────────────────── */}
      <div className={`mobile-drawer ${isMenuOpen ? 'mobile-drawer--open' : ''}`}>
        <div className="mobile-drawer__header">
          <Link to="/" onClick={toggleMenu}>
            <img src="/images/newLogo.png" alt="OptionTrip" />
          </Link>
          <button className="mobile-drawer__close" onClick={toggleMenu} aria-label="Close menu">
            <i className="fa fa-times"></i>
          </button>
        </div>

        <nav className="mobile-drawer__nav">
          <ul>
            <li className={isActive('/')}><Link to="/" onClick={toggleMenu}>{t('common.home')}</Link></li>
            <li className={isActive('/about')}><Link to="/about" onClick={toggleMenu}>{t('common.about')}</Link></li>
            <li className={isActive('/destinations')}><Link to="/destinations" onClick={toggleMenu}>{t('common.destinations')}</Link></li>
            <li className={isActive('/tours')}><Link to="/tours" onClick={toggleMenu}>{t('common.tours')}</Link></li>
            <li className={isActive('/flights')}><Link to="/flights" onClick={toggleMenu}><i className="fa fa-plane"></i> Flights</Link></li>
            <li className={isActive('/hotels')}><Link to="/hotels" onClick={toggleMenu}><i className="fa fa-building"></i> Hotels</Link></li>
            <li>
              <a href="https://blog.optiontrip.com" target="_blank" rel="noopener noreferrer" onClick={toggleMenu}>{t('common.blog')}</a>
            </li>
            <li className={isActive('/contact')}><Link to="/contact" onClick={toggleMenu}>{t('common.contact')}</Link></li>
          </ul>
        </nav>

        {/* Language picker in drawer */}
        <div className="mobile-drawer__lang">
          <p className="mobile-drawer__lang-label"><i className="fa fa-globe"></i> Language</p>
          <div className="mobile-drawer__lang-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`mobile-drawer__lang-btn ${lang.code === currentLang.code ? 'active' : ''}`}
                onClick={() => { handleLangChange(lang.code); toggleMenu(); }}
              >
                <span>{lang.flag}</span>
                <span>{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-drawer__auth">
          {isAuthenticated ? (
            <>
              <div className="mobile-drawer__user">
                <div className="profile-icon">
                  {user?.profileImage ? <img src={user.profileImage} alt={user.name} /> : <i className="icon-user"></i>}
                </div>
                <span>{user?.name}</span>
              </div>
              <Link to="/profile" className="mobile-drawer__auth-item" onClick={toggleMenu}><i className="icon-user"></i> My Profile</Link>
              <Link to="/my-trips" className="mobile-drawer__auth-item" onClick={toggleMenu}><i className="icon-compass"></i> My Trips</Link>
              <button className="mobile-drawer__auth-item mobile-drawer__logout" onClick={() => { handleLogout(); toggleMenu(); }}>
                <i className="icon-logout"></i> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-drawer__auth-item" onClick={toggleMenu}><i className="icon-login"></i> Login</Link>
              <Link to="/signup" className="mobile-drawer__auth-item mobile-drawer__signup" onClick={toggleMenu}><i className="icon-user-add"></i> Sign Up</Link>
            </>
          )}
        </div>

        <div className="mobile-drawer__social">
          <a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
          <a href="https://x.com/OptionTripCom" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
          <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
          <a href="https://www.youtube.com/@optiontrip" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
        </div>
      </div>
    </header>
  );
};

export default Header;
