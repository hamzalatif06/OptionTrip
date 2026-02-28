/**
 * HeroSection - Trip Header with Metadata Cards
 *
 * Structure EXACTLY from TripTap's HeroSection.jsx
 * Component hierarchy matches TripTap 1:1
 *
 * TripTap Structure:
 * HeroSection
 *   ├── SearchResultsBanner → TripBanner (trip title, description, metadata)
 *   └── CardsHoverCarousel → InfoCardsCarousel
 *       └── HeroInfoCard[] → InfoCard[] (weather, language, airport, etc.)
 *
 * OptionTrip Implementation:
 * HeroSection
 *   ├── TripBanner (trip summary with chips)
 *   └── InfoCardsCarousel
 *       └── InfoCard[] (destination, dates, guests, budget, preferences)
 *
 * Key Differences from TripTap:
 * - InfoCard data tailored to trip planning (vs location data)
 * - OptionTrip color palette applied
 * - No Redux dependencies (props-based)
 */

import React, { useMemo } from 'react';
import TripBanner from '../components/TripBanner';
import InfoCardsCarousel from '../components/InfoCardsCarousel';
import InfoCard from '../components/InfoCard';
import './HeroSection.css';

// Material-UI Icons (matching TripTap icon system)
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';

const HeroSection = ({
  tripData = {},
  destination = {},
  dates = {},
  guests = {},
  budget = '',
  isLoading = false,
  isSuccess = true,
  error = null,
}) => {
  // Format date helper (similar to TripTap's date helpers)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Extract month from dates (from TripTap's selectedMonth pattern)
  const selectedMonth = useMemo(() => {
    if (!dates?.month_year) return null;
    const month = dates.month_year.split(' ')[0];
    return month || null;
  }, [dates?.month_year]);

  // Info cards data (adapted from TripTap's HeroInfoCard usage)
  // TripTap has: Weather, Customs Language, Airport Info, Language Spoken, Top Locations
  // OptionTrip has: Destination, Dates, Guests, Budget, Preferences
  const infoCardsData = useMemo(() => [
    {
      id: 'destination',
      title: 'Destination',
      subTitle: destination?.country || undefined,
      icon: <LocationOnIcon />,
      data: [
        { label: 'Location', value: destination?.name || 'Unknown' },
        { label: 'Country', value: destination?.country || '-' },
        { label: 'Region', value: destination?.state || '-' },
      ].filter(item => item.value !== '-'),
      hasPopover: false,
    },
    {
      id: 'dates',
      title: 'Travel Dates',
      subTitle: selectedMonth || undefined,
      icon: <CalendarTodayIcon />,
      data: [
        { label: 'Check-in', value: formatDate(dates?.start_date) },
        { label: 'Check-out', value: formatDate(dates?.end_date) },
        { label: 'Duration', value: `${dates?.duration_days || 0} Days` },
        { label: 'Month', value: dates?.month_year || '-' },
      ],
      hasPopover: false,
    },
    {
      id: 'guests',
      title: 'Travelers',
      icon: <PeopleIcon />,
      data: [
        { label: 'Total Guests', value: guests?.total || 0 },
        { label: 'Adults', value: guests?.adults || 0 },
        guests?.children > 0 && { label: 'Children', value: guests?.children },
        guests?.infants > 0 && { label: 'Infants', value: guests?.infants },
      ].filter(Boolean),
      hasPopover: false,
    },
    {
      id: 'budget',
      title: 'Budget',
      icon: <AccountBalanceWalletIcon />,
      data: [
        {
          label: 'Category',
          value: budget ? budget.charAt(0).toUpperCase() + budget.slice(1) : 'Standard'
        },
        { label: 'Trip Type', value: tripData?.trip_type || tripData?.group_type || 'Leisure' },
      ],
      hasPopover: false,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: <SettingsIcon />,
      data: [
        {
          label: 'What you love !',
          value: tripData?.description || 'No preferences specified'
        },
      ],
      hasPopover: false,
    },
  ], [destination, dates, guests, budget, tripData, selectedMonth]);

  return (
    <section className="hero-section">
      <div className="hero-section__container">
        {/* TripTap: SearchResultsBanner */}
        <TripBanner
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          data={{
            destination,
            dates,
            guests,
            budget,
            description: tripData?.description,
            trip_type: tripData?.trip_type || tripData?.group_type,
          }}
        />

        {/* TripTap: CardsHoverCarousel with HeroInfoCard[] */}
        <InfoCardsCarousel>
          {infoCardsData.map((cardData) => (
            <InfoCard
              key={cardData.id}
              title={cardData.title}
              subTitle={cardData.subTitle}
              icon={cardData.icon}
              data={cardData.data}
              isLoading={isLoading}
              hasPopover={cardData.hasPopover}
              maxVisibleEntries={3}
              minWidth="256px"
              maxWidth="256px"
              height="156px"
            />
          ))}
        </InfoCardsCarousel>
      </div>
    </section>
  );
};

export default HeroSection;
