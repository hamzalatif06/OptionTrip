import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import CurrencySwitcher from '../CurrencySwitcher/CurrencySwitcher';
import CountrySwitcher from '../CountrySwitcher/CountrySwitcher';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { t } = useTranslation();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <>
      {/* ── Email Subscription Strip ──────────────────────────── */}
      <div className="footer-subscribe-strip">
        <div className="container">
          <div className="footer-subscribe-inner">
            <div className="footer-subscribe-text">
              <h4 className="footer-subscribe-title">Stay Inspired</h4>
              <p className="footer-subscribe-subtitle">Get travel ideas and updates from Option Trip.</p>
            </div>
            {subscribed ? (
              <p className="footer-subscribe-success">✓ You're subscribed! Check your inbox soon.</p>
            ) : (
              <form className="footer-subscribe-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="footer-subscribe-input"
                  required
                />
                <button type="submit" className="footer-subscribe-btn">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Footer ───────────────────────────────────────── */}
      <footer className="footer-main" style={{ backgroundImage: `url(/images/background_pattern.png)` }}>

        {/* Five-column links section */}
        <div className="footer-columns">
          <div className="container">
            <div className="footer-columns-grid">

              {/* Col 1 — About */}
              <div className="footer-col footer-col--about">
                <img src="/images/logo-white.png" alt="Option Trip" className="footer-logo" />
                <p className="footer-about-desc">
                  Option Trip is an AI-powered travel planning platform that helps users create personalized trips using intelligent recommendations.
                </p>
                <ul className="footer-contact-list">
                  <li>
                    <i className="fab fa-envelope footer-contact-icon"></i>
                    <a href="mailto:optiontripcom@gmail.com">optiontripcom@gmail.com</a>
                  </li>
                  <li>
                    <i className="fas fa-globe footer-contact-icon"></i>
                    <a href="https://www.optiontrip.com" target="_blank" rel="noopener noreferrer">www.OptionTrip.com</a>
                  </li>
                </ul>

                {/* Trust block */}
                <div className="footer-trust-block">
                  <ul className="footer-trust-list">
                    <li><i className="fas fa-robot"></i> AI-powered travel planning</li>
                    <li><i className="fas fa-route"></i> Personalized travel routes</li>
                    <li><i className="fas fa-star"></i> Smart travel recommendations</li>
                  </ul>
                  <p className="footer-powered-by">Powered by <strong>VI TravelBuddy</strong></p>
                </div>
              </div>

              {/* Col 2 — Company */}
              <div className="footer-col">
                <h4 className="footer-col-title">Company</h4>
                <ul className="footer-col-links">
                  <li><Link to="/about">About Option Trip</Link></li>
                  <li><Link to="/how-it-works">How It Works</Link></li>
                  <li><Link to="/travel-buddy">TravelBuddy (VI)</Link></li>
                  <li><a href="https://blog.optiontrip.com" target="_blank" rel="noopener noreferrer">Blog</a></li>
                  <li><a href="mailto:optiontripcom@gmail.com">Contact Us</a></li>
                </ul>
              </div>

              {/* Col 3 — Travel */}
              <div className="footer-col">
                <h4 className="footer-col-title">Travel</h4>
                <ul className="footer-col-links">
                  <li><Link to="/destinations">Explore Destinations</Link></li>
                  <li><Link to="/trip-ideas">Trip Ideas</Link></li>
                  <li><Link to="/travel-map">Travel Map</Link></li>
                  <li><Link to="/popular-routes">Popular Routes</Link></li>
                  <li><Link to="/travel-tips">Travel Tips</Link></li>
                </ul>
              </div>

              {/* Col 4 — Support */}
              <div className="footer-col">
                <h4 className="footer-col-title">Support</h4>
                <ul className="footer-col-links">
                  <li><Link to="/help-center">Help Center</Link></li>
                  <li><a href="mailto:optiontripcom@gmail.com">Contact Support</a></li>
                  <li><a href="mailto:optiontripcom@gmail.com">Travel Questions</a></li>
                  <li><a href="mailto:optiontripcom@gmail.com">Feedback</a></li>
                </ul>
              </div>

              {/* Col 5 — Legal */}
              <div className="footer-col">
                <h4 className="footer-col-title">Legal</h4>
                <ul className="footer-col-links">
                  <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                  <li><Link to="/terms">Terms of Service</Link></li>
                  <li><Link to="/cookie-policy">Cookie Policy</Link></li>
                  <li><Link to="/data-protection">Data Protection</Link></li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Locale bar */}
        <div className="footer-locale-section">
          <div className="container">
            <div className="footer-locale-bar">
              <div className="footer-locale-item"><LanguageSwitcher /></div>
              <div className="footer-locale-item"><CurrencySwitcher /></div>
              <div className="footer-locale-item"><CountrySwitcher /></div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="container">
            <div className="footer-bottom-inner">
              <p className="footer-copyright-text">© 2026 Option Trip. All rights reserved.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                <a href="https://www.x.com/OptionTripCom" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"><i className="fab fa-twitter"></i></a>
                <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="https://www.youtube.com/@optiontrip" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
          </div>
        </div>

      </footer>
    </>
  );
};

export default Footer;

