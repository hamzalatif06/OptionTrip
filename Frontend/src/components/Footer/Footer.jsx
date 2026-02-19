import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <footer className="pt-20 pb-4" style={{backgroundImage: `url(/images/background_pattern.png)`}}>
      <div className="section-shape top-0" style={{backgroundImage: `url(/images/shape8.png)`}}></div>
      
      <div className="insta-main pb-10">
        <div className="container">
          <div className="insta-inner">
            <div className="follow-button">
              <h5 className="m-0 rounded">
                <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer" className="white text-decoration-none">
                  <i className="fab fa-instagram"></i> {t('common.followOnInstagram')}
                </a>
              </h5>
            </div>
            <div className="row attract-slider">
              {[3, 4, 5, 1, 7, 8, 2, 6, 9].map((num) => (
                <div key={num} className="col-md-3 col-sm-6">
                  <div className="insta-image rounded">
                    <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer">
                      <img src={`/images/insta/ins-${num}.jpg`} alt={`Instagram ${num}`} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-upper pb-4">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-6 col-sm-12 mb-4 pe-4">
              <div className="footer-about">
                <img src="/images/logo-white.png" alt="OptionTrip" />
                <p className="mt-3 mb-3 white">
                  {t('footer.aboutDescription')}
                </p>
                <ul>
                  <li className="white"><strong>{t('footer.poBox')}:</strong> +47-252-254-2542</li>
                  <li className="white"><strong>{t('footer.location')}:</strong> Collins Street, sydney, Australia</li>
                  <li className="white"><strong>{t('footer.email')}:</strong> <a href="mailto:info@optiontrip.com" className="white">info@optiontrip.com</a></li>
                  <li className="white"><strong>{t('footer.website')}:</strong> www.OptionTrip.com</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-12 mb-4">
              <div className="footer-links">
                <h3 className="white">{t('common.quickLinks')}</h3>
                <ul>
                  <li><Link to="/about">{t('common.about')}</Link></li>
                
                  <li><a href="#privacy">{t('common.privacyPolicy')}</a></li>
                  <li><a href="#terms">{t('common.termsConditions')}</a></li>
                  <li><a href="#service">{t('common.customerService')}</a></li>
              
                </ul>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-12 mb-4">
              <div className="footer-links">
                <h3 className="white">{t('common.categories')}</h3>
                <ul>
                  <li><Link to="/tours">{t('common.travel')}</Link></li>
                 
              
                  <li><Link to="/destinations">{t('common.destinations')}</Link></li>
               
          
                </ul>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
              <div className="footer-links">
                <h3 className="white">{t('common.newsletter')}</h3>
                <div className="newsletter-form">
                  <p className="mb-3">{t('footer.newsletterDescription')}</p>
                  <form onSubmit={handleSubscribe} className="border-0 d-flex align-items-center">
                    <input 
                      type="email" 
                      placeholder={t('common.emailAddress')} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-payment">
        <div className="container">
          <div className="row footer-pay align-items-center justify-content-between text-lg-start text-center">
           
            <div className="col-lg-4 footer-payment-nav mb-4">
              <ul className="d-flex align-items-center">
                <li className="me-2 w-75">
                  <LanguageSwitcher />
                </li>
              
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        <div className="container">
          <div className="copyright-inner rounded p-3 d-md-flex align-items-center justify-content-between">
            <div className="copyright-text">
              <p className="m-0 white">2025 {t('footer.copyright')}</p>
            </div>
            <div className="social-links">
              <ul>
                <li>
                  <a href="https://www.facebook.com/optiontrip" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook" aria-hidden="true"></i></a>
                </li>
                <li>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                </li>
                <li>
                  <a href="https://www.instagram.com/option_trip" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" aria-hidden="true"></i></a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@optiontrip" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube" aria-hidden="true"></i></a>
                </li>
                <li>
                  <a href="#"><i className="fab fa-linkedin" aria-hidden="true"></i></a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

