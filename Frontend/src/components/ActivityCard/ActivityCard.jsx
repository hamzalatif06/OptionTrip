import React, { useMemo } from 'react';
import './ActivityCard.css';

// Material-UI Icons (matching TripTap icon system)
import MuseumIcon from '@mui/icons-material/Museum';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HikingIcon from '@mui/icons-material/Hiking';
import SpaIcon from '@mui/icons-material/Spa';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PlaceIcon from '@mui/icons-material/Place';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RoomIcon from '@mui/icons-material/Room';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddIcon from '@mui/icons-material/Add';
import ParkIcon from '@mui/icons-material/Park';
import NightlifeIcon from '@mui/icons-material/Nightlife';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SportsIcon from '@mui/icons-material/Sports';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

const ActivityCard = ({
  activity = {},
  searchCenter,
  dayData = {},
  onActivityBook,
  onSwapActivity,
  onRemoveActivity,
  onOpenGoogleDirections,
  isEditable = true,
}) => {
  // Get activity icon based on category (MUI Icons)
  const getActivityIcon = (category) => {
    const iconSize = { fontSize: { xl: 24, lg: 20, xs: 16 } };
    const iconMap = {
      sightseeing: <MuseumIcon sx={iconSize} />,
      dining: <RestaurantIcon sx={iconSize} />,
      adventure: <HikingIcon sx={iconSize} />,
      relaxation: <SpaIcon sx={iconSize} />,
      culture: <TheaterComedyIcon sx={iconSize} />,
      shopping: <ShoppingBagIcon sx={iconSize} />,
      transport: <DirectionsCarIcon sx={iconSize} />,
      nature: <ParkIcon sx={iconSize} />,
      entertainment: <LocalActivityIcon sx={iconSize} />,
      nightlife: <NightlifeIcon sx={iconSize} />,
      beach: <BeachAccessIcon sx={iconSize} />,
      museum: <MuseumIcon sx={iconSize} />,
      historical: <AccountBalanceIcon sx={iconSize} />,
      outdoor: <HikingIcon sx={iconSize} />,
      wellness: <SpaIcon sx={iconSize} />,
      sports: <SportsIcon sx={iconSize} />,
      photography: <CameraAltIcon sx={iconSize} />,
      other: <PlaceIcon sx={iconSize} />,
    };
    return iconMap[category?.toLowerCase()] || <PlaceIcon sx={iconSize} />;
  };

  // Render star rating with MUI icons
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} sx={{ fontSize: { xl: 16, lg: 14, md: 13, xs: 12 }, color: '#029e9d' }} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalfIcon key={i} sx={{ fontSize: { xl: 16, lg: 14, md: 13, xs: 12 }, color: '#029e9d' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} sx={{ fontSize: { xl: 16, lg: 14, md: 13, xs: 12 }, color: '#029e9d', opacity: 0.55 }} />);
      }
    }
    return stars;
  };

  // Get activity image from Google Places API data
  // Images come from backend enrichment via placesService.js (NO Unsplash)
  const getActivityImage = () => {
    // Return image from Google Places API enrichment
    // If no image, return empty string and let onError handle fallback
    return activity.image || activity.activity_image_url || '';
  };

  // Generate dynamic tags based on activity data
  const generateTags = useMemo(() => {
    // If activity has tags, use them
    if (activity.tags && activity.tags.length > 0) {
      return activity.tags.slice(0, 4);
    }
    if (activity.businessCategories && activity.businessCategories.length > 0) {
      return activity.businessCategories.slice(0, 4);
    }

    // Generate tags dynamically from activity properties
    const tags = [];
    const category = activity.category || activity.type;

    // Add category-based tag
    if (category) {
      const categoryLabels = {
        sightseeing: 'Landmark',
        dining: 'Restaurant',
        adventure: 'Adventure',
        relaxation: 'Wellness',
        culture: 'Cultural',
        shopping: 'Shopping',
        transport: 'Transport',
        nature: 'Nature',
        entertainment: 'Entertainment',
        nightlife: 'Nightlife',
        beach: 'Beach',
        museum: 'Museum',
        historical: 'Historical',
        outdoor: 'Outdoor',
        wellness: 'Spa & Wellness',
        sports: 'Sports',
        photography: 'Photo Spot',
      };
      tags.push(categoryLabels[category?.toLowerCase()] || category);
    }

    // Add duration-based tag
    if (activity.duration) {
      const durationLower = activity.duration.toLowerCase();
      if (durationLower.includes('hour') || durationLower.includes('hr')) {
        const hours = parseInt(activity.duration);
        if (hours <= 1) tags.push('Quick Visit');
        else if (hours <= 2) tags.push('Half Day');
        else tags.push('Full Experience');
      }
    }

    // Add cost-based tag
    if (activity.cost !== undefined && activity.cost !== null) {
      const cost = typeof activity.cost === 'number' ? activity.cost : parseInt(activity.cost) || 0;
      if (cost === 0) tags.push('Free');
      else if (cost <= 20) tags.push('Budget Friendly');
      else if (cost <= 50) tags.push('Moderate');
      else tags.push('Premium');
    }

    // Add time-of-day based tag
    if (activity.time) {
      const hour = parseInt(activity.time.split(':')[0]);
      if (hour < 12) tags.push('Morning');
      else if (hour < 17) tags.push('Afternoon');
      else tags.push('Evening');
    }

    // Add rating-based tag if high rating
    if (activity.rating && activity.rating >= 4.5) {
      tags.push('Top Rated');
    }

    // Add place name based tag if it contains keywords
    const placeName = (activity.place_name || activity.title || '').toLowerCase();
    if (placeName.includes('museum')) tags.push('Museum');
    else if (placeName.includes('park')) tags.push('Park');
    else if (placeName.includes('beach')) tags.push('Beach');
    else if (placeName.includes('temple') || placeName.includes('church') || placeName.includes('mosque')) tags.push('Religious Site');
    else if (placeName.includes('market')) tags.push('Market');
    else if (placeName.includes('restaurant') || placeName.includes('cafe') || placeName.includes('café')) tags.push('Dining');

    // Return unique tags, max 4
    return [...new Set(tags)].slice(0, 4);
  }, [activity]);

  // Generate dynamic subtitle/header based on activity
  const generateSubtitle = useMemo(() => {
    if (activity.subtitle || activity.activity_header) {
      return activity.subtitle || activity.activity_header;
    }

    const category = activity.category || activity.type || '';
    const placeName = activity.place_name || activity.title || '';

    // Generate contextual subtitle
    const subtitles = {
      sightseeing: `Popular ${placeName.includes('museum') ? 'museum' : 'attraction'} destination`,
      dining: `Local favorite for ${activity.time && parseInt(activity.time) < 12 ? 'breakfast & brunch' : 'dining'}`,
      adventure: 'Exciting outdoor experience',
      relaxation: 'Perfect for unwinding',
      culture: 'Rich cultural experience',
      shopping: 'Great shopping destination',
      transport: 'Convenient travel option',
      nature: 'Beautiful natural scenery',
      entertainment: 'Fun entertainment venue',
      nightlife: 'Vibrant nightlife spot',
      beach: 'Stunning beach location',
      museum: 'Fascinating museum visit',
      historical: 'Historic landmark',
      outdoor: 'Outdoor adventure awaits',
      wellness: 'Relaxing wellness experience',
      sports: 'Active sports venue',
      photography: 'Instagram-worthy spot',
    };

    return subtitles[category.toLowerCase()] || 'Must-visit destination';
  }, [activity]);

  // Activity details
  const activityType = activity.type || activity.category || 'Activity';
  const activityHeader = generateSubtitle;
  const activityName = activity.title || activity.name || activity.place_name || 'Activity';
  const activityRating = activity.rating || null;
  const activityCost = activity.cost !== undefined && activity.cost !== null
    ? (typeof activity.cost === 'number' ? `$${activity.cost}` : activity.cost)
    : null;
  const activityDescription = activity.description || '';
  const businessCategories = generateTags;
  const activityTime = activity.time || '';
  const hasBooking = activity.has_booking || false;

  // Format cost display
  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return null;
    if (typeof cost === 'string' && cost.startsWith('$')) return cost;
    if (typeof cost === 'number') {
      if (cost === 0) return 'Free';
      return `$${cost}`;
    }
    return cost;
  };

  // Calculate distance from search center
  const calculateDistance = () => {
    if (activity.distance) return activity.distance;
    // Calculate approximate distance if coordinates are available
    if (activity.location?.coordinates && searchCenter?.geo_location) {
      const lat1 = activity.location.coordinates.lat;
      const lng1 = activity.location.coordinates.lng;
      const lat2 = searchCenter.geo_location[1];
      const lng2 = searchCenter.geo_location[0];

      if (lat1 && lng1 && lat2 && lng2) {
        // Haversine formula for distance
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return `${distance.toFixed(2)} miles`;
      }
    }
    return null;
  };

  return (
    <div className="activity-card">
      {/* Main Card Content */}
      <div className="activity-card__main">
        {/* Image Section */}
        <div className="activity-card__image-wrapper">
          <img
            src={getActivityImage()}
            alt={activityName}
            className="activity-card__image"
            loading="lazy"
            onError={(e) => {
              e.target.src = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop`;
            }}
          />
        </div>

        {/* Content Section */}
        <div className="activity-card__content">
          {/* First Row - Activity Type & Time Badge */}
          <div className="activity-card__header-row">
            <div className="activity-card__type-info">
              <span className="activity-card__type-icon">
                {getActivityIcon(activityType)}
              </span>
              <span className="activity-card__type-label">
                {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
              </span>
              <div className="activity-card__divider"></div>
              <span className="activity-card__type-subtitle">
                {activityHeader}
              </span>
            </div>
            {hasBooking && (
              <div className="activity-card__time-badge">
                {activityTime}
              </div>
            )}
          </div>

          {/* Second Row - Activity Title and Rating */}
          <div className="activity-card__title-section">
            <h3 className="activity-card__title">
              {activityName}
            </h3>
            <div className="activity-card__rating-wrapper">
              {activityRating && (
                <>
                  <span className="activity-card__rating-value">{activityRating}</span>
                  <div className="activity-card__rating-stars">
                    {renderStars(parseFloat(activityRating))}
                  </div>
                </>
              )}
              {activityRating && activityCost && <div className="activity-card__divider"></div>}
              {activityCost && (
                <span className="activity-card__cost">Cost: {formatCost(activityCost)}</span>
              )}
              {!activityRating && !activityCost && activity.duration && (
                <span className="activity-card__duration">Duration: {activity.duration}</span>
              )}
            </div>
          </div>

          {/* Third Row - Description */}
          {activityDescription && (
            <p className="activity-card__description">
              {activityDescription}
            </p>
          )}

          {/* Fourth Row - Tags/Keywords */}
          {businessCategories.length > 0 && (
            <div className="activity-card__tags">
              {businessCategories.map((tag, index) => (
                <span key={index} className="activity-card__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Location with Get Directions */}
          <div className="activity-card__location">
            <RoomIcon sx={{ fontSize: { xl: 18, lg: 15, md: 16, xs: 14 }, color: '#17233e' }} />
            <span className="activity-card__location-text">
              {calculateDistance() ? (
                <><strong>{calculateDistance()}</strong> from {searchCenter?.title || 'city center'}</>
              ) : (
                <>{activity.address || activity.location?.name || searchCenter?.title || 'View location'}</>
              )}
            </span>
            {onOpenGoogleDirections && (
              <button
                className="activity-card__directions-link"
                onClick={() => onOpenGoogleDirections({
                  ...activity,
                  searchCenter
                })}
              >
                Get directions
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons (Right Side) */}
        {isEditable && (
          <div className="activity-card__actions">
            <div className="activity-card__actions-divider"></div>
            <div className="activity-card__actions-buttons">
              <button
                className={`activity-card__book-button ${hasBooking ? 'activity-card__book-button--booked' : ''}`}
                onClick={() => onActivityBook && onActivityBook(activity)}
              >
                {!hasBooking && <AddIcon sx={{ fontSize: { xl: 18, lg: 16, md: 14, xs: 16 } }} />}
                <span>{hasBooking ? 'View Booking' : 'Book'}</span>
              </button>
              {!hasBooking && (
                <div className="activity-card__actions-secondary">
                  <button
                    className="activity-card__action-button activity-card__action-button--remove"
                    onClick={() => onRemoveActivity && onRemoveActivity(activity)}
                  >
                    <CloseIcon sx={{ fontSize: 20 }} />
                    <span>Remove</span>
                  </button>
                  {/* TODO: Implement swap functionality
                  <button
                    className="activity-card__action-button activity-card__action-button--swap"
                    onClick={() => onSwapActivity && onSwapActivity(activity)}
                  >
                    <SwapHorizIcon sx={{ fontSize: 20, transform: 'rotate(90deg)' }} />
                    <span>Swap</span>
                  </button>
                  */}
                </div>
              )}
              {hasBooking && (
                <p className="activity-card__booking-notice">
                  You need to cancel your current booking in order to swap or remove activity.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
