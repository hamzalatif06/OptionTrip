/**
 * TripBanner Component
 *
 * Adapted from TripTap's SearchResultsBanner
 * Displays trip title, description, and metadata chips
 *
 * Structure:
 * - Background image (optional)
 * - Title and description
 * - Metadata chips (dates, travelers, budget)
 */

import React from 'react';
import './TripBanner.css';

const TripBanner = ({
  isLoading = false,
  isSuccess = true,
  error = null,
  data = {},
}) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Extract data with fallbacks
  const {
    destination,
    dates,
    guests,
    budget,
    description,
    trip_type,
  } = data;

  const destinationName = destination?.name || 'Your Destination';
  const startDate = dates?.start_date;
  const endDate = dates?.end_date;
  const durationDays = dates?.duration_days || 0;
  const totalGuests = guests?.total || 0;
  const adultsCount = guests?.adults || 0;
  const budgetCategory = budget ? budget.charAt(0).toUpperCase() + budget.slice(1) : 'Budget';

  // Get background image using destination name for dynamic lookup
  const getDestinationImage = () => {
    // Map of popular destinations to Unsplash photo IDs for consistent, high-quality images
    const destinationImages = {
      // Europe
      'Paris': 'photo-1502602898657-3e91760cbb34', // Eiffel Tower
      'London': 'photo-1513635269975-59663e0ac1ad', // London cityscape
      'Rome': 'photo-1552832230-c0197dd311b5', // Rome architecture
      'Barcelona': 'photo-1583422409516-2895a77efded', // Barcelona cityscape
      'Amsterdam': 'photo-1534351590666-13e3e96b5017', // Amsterdam canals
      'Istanbul': 'photo-1524231757912-21f4fe3a7200', // Istanbul mosque
      'Prague': 'photo-1592906209472-a36b1f3782ef', // Prague architecture
      'Venice': 'photo-1514890547357-a9ee288728e0', // Venice canals
      'Athens': 'photo-1555993539-1732b0258235', // Athens Acropolis
      'Moscow': 'photo-1513326738677-b964603b136d', // Moscow Red Square
      'Russia': 'photo-1513326738677-b964603b136d', // Russia/Moscow

      // Asia
      'Tokyo': 'photo-1540959733332-eab4deabeeaf', // Tokyo cityscape
      'Dubai': 'photo-1512453979798-5ea266f8880c', // Dubai skyline
      'Singapore': 'photo-1525625293386-3f8f99389edd', // Singapore skyline
      'Bali': 'photo-1537996194471-e657df975ab4', // Bali beach
      'Thailand': 'photo-1552465011-b4e21bf6e79a', // Thailand temple
      'Bangkok': 'photo-1528181304800-259b08848526', // Bangkok temple
      'Hong Kong': 'photo-1536599018102-9f803c140fc1', // Hong Kong skyline
      'Seoul': 'photo-1517154421773-0529f29ea451', // Seoul cityscape
      'Beijing': 'photo-1508804185872-d7badad00f7d', // Beijing Temple
      'Shanghai': 'photo-1548919973-5cef591cdbc9', // Shanghai skyline
      'Vietnam': 'photo-1583417267826-aebc4d1542e1', // Vietnam bay
      'India': 'photo-1524492412937-b28074a5d7da', // Taj Mahal
      'Pakistan': 'photo-1583911860205-72f8ac8ddcbe', // Pakistan mountains
      'Nepal': 'photo-1506905925346-21bda4d32df4', // Nepal mountains
      'Maldives': 'photo-1514282401047-d79a71a590e8', // Maldives beach
      'Sri Lanka': 'photo-1566073771259-6a8506099945', // Sri Lanka temple

      // Americas
      'New York': 'photo-1496442226666-8d4d0e62e6e9', // NYC skyline
      'Los Angeles': 'photo-1534190239940-9ba8944ea261', // LA cityscape
      'San Francisco': 'photo-1506146332389-18140dc7b2fb', // SF Golden Gate
      'Miami': 'photo-1533106418989-88406c7cc8ca', // Miami beach
      'Chicago': 'photo-1477959858617-67f85cf4f1df', // Chicago skyline
      'Las Vegas': 'photo-1506929562872-bb421503ef21', // Las Vegas strip
      'Rio de Janeiro': 'photo-1483729558449-99ef09a8c325', // Rio Christ statue
      'Mexico': 'photo-1518638150340-f706e86654de', // Mexico pyramids
      'Canada': 'photo-1503614472-8c93d56e92ce', // Canada mountains
      'Toronto': 'photo-1517935706615-2717063c2225', // Toronto skyline
      'Vancouver': 'photo-1505935428862-770b6f24f629', // Vancouver cityscape
      'Peru': 'photo-1587595431973-160d0d94add1', // Machu Picchu
      'Argentina': 'photo-1589909202802-8f4aadce1849', // Buenos Aires
      'Chile': 'photo-1469854523086-cc02fe5d8800', // Chilean mountains
      'Brazil': 'photo-1483729558449-99ef09a8c325', // Brazil Rio

      // Oceania
      'Sydney': 'photo-1506973035872-a4ec16b8e8d9', // Sydney Opera House
      'Australia': 'photo-1506973035872-a4ec16b8e8d9', // Australia/Sydney
      'Melbourne': 'photo-1514395462725-fb4566210144', // Melbourne cityscape
      'New Zealand': 'photo-1507699622108-4be3abd695ad', // NZ mountains

      // Middle East & Africa
      'Cairo': 'photo-1539768942893-daf53e448371', // Cairo pyramids
      'Egypt': 'photo-1539768942893-daf53e448371', // Egypt pyramids
      'Morocco': 'photo-1489749798305-4fea3ae63d43', // Morocco architecture
      'Kenya': 'photo-1516026672322-bc52d61a55d5', // Kenya safari
      'South Africa': 'photo-1484318571209-661cf29a69c3', // Cape Town
      'Israel': 'photo-1544251927-3f0f60b5e78d', // Jerusalem
    };

    // Get photo ID for destination or use default travel image
    const normalizedDestination = destinationName.split(',')[0].trim(); // Handle "Paris, France" -> "Paris"
    const photoId = destinationImages[normalizedDestination] || 'photo-1488646953014-85cb44e25828'; // Default travel image

    // Return Unsplash CDN URL with photo ID
    return `https://images.unsplash.com/${photoId}?w=1920&h=800&fit=crop&q=80`;
  };

  const backgroundImage = getDestinationImage();

  // Metadata tabs (from TripTap's tabs_data pattern)
  const metadataTabs = [
    durationDays > 0 ? `${durationDays} Day${durationDays > 1 ? 's' : ''}` : null,
    adultsCount > 0 ? `${adultsCount} Adult${adultsCount > 1 ? 's' : ''}` : null,
    startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : null,
  ].filter(Boolean);

  // Loading state
  if (isLoading) {
    return (
      <div className="trip-banner">
        <div className="trip-banner__content">
          <div className="trip-banner__skeleton">
            <div className="trip-banner__skeleton-title"></div>
            <div className="trip-banner__skeleton-subtitle"></div>
            <div className="trip-banner__skeleton-chips"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="trip-banner trip-banner--error">
        <div className="trip-banner__content">
          <h1 className="trip-banner__title">Error Loading Trip</h1>
          <p className="trip-banner__description">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="trip-banner"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 45, 70, 0.6), rgba(18, 45, 70, 0.6)), url("${backgroundImage}")`
      }}
    >
      <div className="trip-banner__content">
        {/* Title */}
        <h1 className="trip-banner__title">
          Your Trip to {destinationName}
        </h1>

        {/* Description/Subtitle */}
        <p className="trip-banner__description">
          {description || `${destinationName}, with its iconic landmarks, rich culture, and vibrant atmosphere, offers an unforgettable experience for travelers worldwide.`}
        </p>

        {/* Metadata Chips (from TripTap's ChipTabGroup pattern) */}
        {metadataTabs.length > 0 && (
          <div className="trip-banner__chips">
            {metadataTabs.map((tab, index) => (
              <div key={index} className="trip-banner__chip">
                {tab}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripBanner;
