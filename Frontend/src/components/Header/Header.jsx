import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const closeTimeout = useRef(null);

  // Fetch user's current location
  useEffect(() => {
    const fetchLocation = async () => {
      // Check if we have cached location (valid for 1 hour)
      const cachedLocation = localStorage.getItem('userLocation');
      const cachedTime = localStorage.getItem('userLocationTime');

      if (cachedLocation && cachedTime) {
        const hourAgo = Date.now() - (60 * 60 * 1000);
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
                // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                  {
                    headers: {
                      'Accept-Language': i18n.language || 'en'
                    }
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
                  const country = data.address?.country || '';
                  const locationString = city && country ? `${city}, ${country}` : city || country || t('header.location');

                  setUserLocation(locationString);
                  localStorage.setItem('userLocation', locationString);
                  localStorage.setItem('userLocationTime', Date.now().toString());
                }
              } catch (error) {
                console.error('Reverse geocoding error:', error);
                setUserLocation(t('header.location'));
              }
              setIsLoadingLocation(false);
            },
            (error) => {
              console.log('Geolocation error:', error.message);
              setUserLocation(t('header.location'));
              setIsLoadingLocation(false);
            },
            { timeout: 10000, maximumAge: 300000 }
          );
        } catch (error) {
          setUserLocation(t('header.location'));
          setIsLoadingLocation(false);
        }
      } else {
        setUserLocation(t('header.location'));
        setIsLoadingLocation(false);
      }
    };

    fetchLocation();
  }, [t, i18n.language]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAuthDropdown = () => {
    setIsAuthDropdownOpen(!isAuthDropdownOpen);
  };

  const openAuthDropdown = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setIsAuthDropdownOpen(true);
  };

  const closeAuthDropdown = () => {
    closeTimeout.current = setTimeout(() => {
      setIsAuthDropdownOpen(false);
    }, 150);
  };

  const closeAuthDropdownImmediately = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setIsAuthDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeAuthDropdownImmediately();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Format date based on current language
  const formatDate = () => {
    const date = new Date();
    try {
      return date.toLocaleDateString(i18n.language || 'en', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <header className="main_header_area">
      <div className="header-content py-1 bg-theme">
        <div className="container d-flex align-items-center justify-content-between">
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
                  {isLoadingLocation ? (
                    <span className="location-loading">{t('header.detectingLocation') || 'Detecting...'}</span>
                  ) : (
                    <span>{userLocation || t('header.location')}</span>
                  )}
                </a>
              </li>
        
            </ul>
          </div>
          <div className="links float-right">
            <ul>
              <li>
                <a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-facebook" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="#" className="white">
                  <i className="fab fa-twitter" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-instagram" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@optiontrip" target="_blank" rel="noopener noreferrer" className="white">
                  <i className="fab fa-youtube" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="#" className="white">
                  <i className="fab fa-linkedin" aria-hidden="true"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="header_menu" id="header_menu">
        <nav className="navbar navbar-default">
          <div className="container">
            <div className="navbar-flex d-flex align-items-center justify-content-between w-100 pb-3 pt-3">
              <div className="navbar-header">
                <Link className="navbar-brand" to="/">
                  <img src="/images/newLogo.png" alt="OptionTrip" />
                </Link>
              </div>
              
              <div className={`navbar-collapse1 d-flex align-items-center ${isMenuOpen ? 'show' : ''}`} id="bs-example-navbar-collapse-1">
                <ul className="nav navbar-nav" id="responsive-menu">
                  <li className={`dropdown submenu ${isActive('/')}`}>
                    <Link to="/" className="dropdown-toggle">
                      {t('common.home')}
                    </Link>
                  </li>
                  <li className={isActive('/about')}>
                    <Link to="/about">{t('common.about')}</Link>
                  </li>
                  <li className={`dropdown submenu ${isActive('/destinations')}`}>
                    <Link to="/destinations" className="dropdown-toggle">
                      {t('common.destinations')} <i className="icon-arrow-down" aria-hidden="true"></i>
                    </Link>
                  </li>
                  <li className={`dropdown submenu ${isActive('/tours')}`}>
                    <Link to="/tours" className="dropdown-toggle">
                      {t('common.tours')} <i className="icon-arrow-down" aria-hidden="true"></i>
                    </Link>
                  </li>
                  <li className={`dropdown submenu ${isActive('/blog')}`}>
                    <Link to="/blog" className="dropdown-toggle">
                      {t('common.blog')} <i className="icon-arrow-down" aria-hidden="true"></i>
                    </Link>
                  </li>
                  <li className="search-main">
                    <a href="#search1" className="mt_search">
                      <i className="fa fa-search"></i>
                    </a>
                  </li>
                </ul>
              </div>
              
              <div className="register-login d-flex align-items-center gap-3">
                <div
                  className="auth-dropdown-wrapper"
                  onMouseEnter={openAuthDropdown}
                  onMouseLeave={closeAuthDropdown}
                >
                  <button
                    className="auth-dropdown-toggle"
                    onClick={toggleAuthDropdown}
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="profile-icon">
                          {user?.profileImage ? (
                            <img src={user.profileImage} alt={user.name} />
                          ) : (
                            <i className="icon-user"></i>
                          )}
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
                          <Link
                            to="/profile"
                            className="auth-dropdown-item"
                            onClick={closeAuthDropdownImmediately}
                          >
                            <i className="icon-user"></i>
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/my-trips"
                            className="auth-dropdown-item"
                            onClick={closeAuthDropdownImmediately}
                          >
                            <i className="icon-compass"></i>
                            <span>My Trips</span>
                          </Link>
                          <div className="dropdown-divider"></div>
                          <button
                            className="auth-dropdown-item logout-item"
                            onClick={handleLogout}
                          >
                            <i className="icon-logout"></i>
                            <span>Logout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            className="auth-dropdown-item"
                            onClick={closeAuthDropdownImmediately}
                          >
                            <i className="icon-login"></i>
                            <span>Login</span>
                          </Link>
                          <Link
                            to="/signup"
                            className="auth-dropdown-item"
                            onClick={closeAuthDropdownImmediately}
                          >
                            <i className="icon-user-add"></i>
                            <span>Sign Up</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Link to="/contact" className="nir-btn white">{t('common.contact')}</Link>
              </div>

              <div id="slicknav-mobile" onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

