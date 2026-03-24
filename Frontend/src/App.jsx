import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { ToastContainer } from 'react-toastify';
import './i18n'; // Initialize i18n
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast-custom.css';
import './styles/buttons.css';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Tours from './pages/Tours';
import Destinations from './pages/Destinations';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail/BlogDetail';
import Contact from './pages/Contact';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback';
import TripIterationsPage from './pages/TripIterationsPage/TripIterationsPage';
import PlannedTripPage from './pages/PlannedTripPage/PlannedTripPage';
import MyTripsPage from './pages/MyTripsPage/MyTripsPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AutoTranslate from './components/AutoTranslate/AutoTranslate';
import TravelBuddyPage from './pages/TravelBuddyPage';
import HowItWorksPage from './pages/HowItWorksPage';
import TripIdeasPage from './pages/TripIdeasPage';
import TravelMapPage from './pages/TravelMapPage';
import PopularRoutesPage from './pages/PopularRoutesPage';
import TravelTipsPage from './pages/TravelTipsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import DataProtectionPage from './pages/DataProtectionPage';
import HelpCenterPage from './pages/HelpCenterPage';
import FlightSearch from './pages/FlightSearch';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    // Hide preloader after page load
    const preloader = document.getElementById('preloader');
    const status = document.getElementById('status');

    if (preloader && status) {
      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.style.overflow = 'visible';
      }, 500);
    }
  }, []);

  return (
    <LocaleProvider>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AutoTranslate />
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
            {/* Auth Routes - Without Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />

            {/* Trip Routes - Without Layout */}
            <Route path="/trips/:tripId" element={<TripIterationsPage />} />
            <Route path="/planned-trip/:tripId" element={<PlannedTripPage />} />
            <Route path="/my-trips" element={<MyTripsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Main Routes - With Layout */}
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/destinations" element={<Destinations />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/contact" element={<Contact />} />

                  {/* Company */}
                  <Route path="/travel-buddy" element={<TravelBuddyPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />

                  {/* Travel */}
                  <Route path="/trip-ideas" element={<TripIdeasPage />} />
                  <Route path="/travel-map" element={<TravelMapPage />} />
                  <Route path="/popular-routes" element={<PopularRoutesPage />} />
                  <Route path="/travel-tips" element={<TravelTipsPage />} />

                  {/* Legal */}
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                  <Route path="/data-protection" element={<DataProtectionPage />} />

                  {/* Flights */}
                  <Route path="/flights" element={<FlightSearch />} />

                  {/* Support */}
                  <Route path="/help-center" element={<HelpCenterPage />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </LocaleProvider>
  );
}

export default App;
