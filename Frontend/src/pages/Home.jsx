import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import Banner from '../components/Banner/Banner';
import AboutUs from '../components/AboutUs/AboutUs';
import TopDestinations from '../components/TopDestinations/TopDestinations';
import AboutSection from '../components/AboutSection/AboutSection';
import BestTours from '../components/BestTours/BestTours';
import LastMinuteDeals from '../components/LastMinuteDeals/LastMinuteDeals';
import DiscountAction from '../components/DiscountAction/DiscountAction';
import FeaturedBlogSection from '../components/FeaturedBlogSection/FeaturedBlogSection';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import OurTeam from '../components/OurTeam/OurTeam';
import Testimonials from '../components/Testimonials/Testimonials';
import RecentArticles from '../components/RecentArticles/RecentArticles';
import Loader from '../components/Loader/Loader';
import HomeBookingSection from '../components/HomeBookingSection/HomeBookingSection';
import WelcomeModal from '../components/WelcomeModal/WelcomeModal';
import { setAccessToken } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      setAccessToken(token);
      refreshProfile()
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch profile:', err);
          navigate('/', { replace: true });
        });
    }

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
      <PageMeta title="Your Personal Travel Partner Vi" description="Plan your perfect trip with Travel Partner Vi. Describe where you want to go and get a personalized itinerary, flights, and stays in minutes." path="/" />
      <WelcomeModal />
      <Banner />
      <HomeBookingSection />



      <WhyChooseUs ctaOnly />
      <BestTours />

      <FeaturedBlogSection />





    </>
  );
};

export default Home;


