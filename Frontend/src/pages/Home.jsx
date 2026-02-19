import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import AboutUs from '../components/AboutUs/AboutUs';
import TopDestinations from '../components/TopDestinations/TopDestinations';
import AboutSection from '../components/AboutSection/AboutSection';
import BestTours from '../components/BestTours/BestTours';
import LastMinuteDeals from '../components/LastMinuteDeals/LastMinuteDeals';
import DiscountAction from '../components/DiscountAction/DiscountAction';
import ProductsSection from '../components/ProductsSection/ProductsSection';
// import OfferPackages from '../components/OfferPackages/OfferPackages';
import OurTeam from '../components/OurTeam/OurTeam';
import Testimonials from '../components/Testimonials/Testimonials';
import RecentArticles from '../components/RecentArticles/RecentArticles';
import Loader from '../components/Loader/Loader';
import { setAccessToken } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // Handle OAuth callback token
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // Store token and fetch user profile
      setAccessToken(token);
      refreshProfile()
        .then(() => {
          // Clear token from URL after successful login
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          navigate('/', { replace: true });
        });
    }

    // Show loader on initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.search, navigate, refreshProfile]);

  if (loading) {
    return <Loader size="fullpage" />;
  }

  return (
    <>
      <Banner />
      <AboutUs />
      <TopDestinations />
      <AboutSection />
      <BestTours />
      <LastMinuteDeals />
      <ProductsSection />
      <DiscountAction />
      {/* <OfferPackages /> */}
      {/* <OurTeam /> */}
      <Testimonials />
      <RecentArticles />
    </>
  );
};

export default Home;


