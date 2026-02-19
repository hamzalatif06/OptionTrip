import React from 'react';
import './TripIterationCard.css';

const TripIterationCard = ({ option, isSelected, onSelect, destination }) => {
  const handleClick = () => {
    onSelect(option.option_id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(option.option_id);
    }
  };

  // Get destination image using destination name for dynamic lookup
  // Each card shows a different image for variety in the carousel
  const getDestinationImage = () => {
    const destinationName = destination?.name || 'travel';
    // Extract just the city/destination name (e.g., "Paris" from "Paris, France")
    const normalizedDestination = destinationName.split(',')[0].trim();

    // Map of popular destinations to arrays of 3 Unsplash photo IDs (one for each pace)
    const destinationImages = {
      // Europe
      'Paris': [
        'photo-1502602898657-3e91760cbb34', // Eiffel Tower (slow)
        'photo-1499856871958-5b9627545d1a', // Paris street (moderate)
        'photo-1431274172761-fca41d930114', // Notre-Dame (fast)
      ],
      'London': [
        'photo-1513635269975-59663e0ac1ad', // London cityscape
        'photo-1505761671935-60b3a7427bad', // Big Ben
        'photo-1486299267070-83823f5448dd', // London bridge
      ],
      'Rome': [
        'photo-1552832230-c0197dd311b5', // Rome architecture
        'photo-1525874684015-58379d421a52', // Colosseum
        'photo-1529260830199-42c24126f198', // Trevi Fountain
      ],
      'Barcelona': [
        'photo-1583422409516-2895a77efded', // Barcelona cityscape
        'photo-1562883676-8c7feb83f09b', // Sagrada Familia
        'photo-1511527661048-7fe73d85e9a4', // Park Güell
      ],
      'Amsterdam': [
        'photo-1534351590666-13e3e96b5017', // Amsterdam canals
        'photo-1512470876302-972faa2aa9a4', // Amsterdam bikes
        'photo-1541963058-ad97fa4ffb20', // Amsterdam night
      ],
      'Moscow': [
        'photo-1513326738677-b964603b136d', // Moscow Red Square
        'photo-1547448415-e9f5b28e570d', // Moscow cathedral
        'photo-1520106212299-d99c443e4568', // Moscow skyline
      ],
      'Russia': [
        'photo-1513326738677-b964603b136d', // Moscow Red Square
        'photo-1547448415-e9f5b28e570d', // Moscow cathedral
        'photo-1520106212299-d99c443e4568', // Moscow skyline
      ],

      // Asia
      'Tokyo': [
        'photo-1540959733332-eab4deabeeaf', // Tokyo cityscape
        'photo-1542051841857-5f90071e7989', // Tokyo night
        'photo-1503899036084-c55cdd92da26', // Tokyo temple
      ],
      'Dubai': [
        'photo-1512453979798-5ea266f8880c', // Dubai skyline
        'photo-1518684079-3c830dcef090', // Burj Khalifa
        'photo-1559827260-dc66d52bef19', // Dubai marina
      ],
      'Singapore': [
        'photo-1525625293386-3f8f99389edd', // Singapore skyline
        'photo-1508964942454-1a56651d54ac', // Marina Bay Sands
        'photo-1496939376851-89342e90adcd', // Gardens by the Bay
      ],
      'Thailand': [
        'photo-1552465011-b4e21bf6e79a', // Thailand temple
        'photo-1506665531195-3566af2b4dfa', // Thai beach
        'photo-1528181304800-259b08848526', // Bangkok
      ],
      'Bali': [
        'photo-1537996194471-e657df975ab4', // Bali beach
        'photo-1555400038-63f5ba517a47', // Bali temple
        'photo-1518548419970-58e3b4079ab2', // Bali rice terraces
      ],
      'India': [
        'photo-1524492412937-b28074a5d7da', // Taj Mahal
        'photo-1548013146-72479768bada', // Indian palace
        'photo-1564507592333-c60657eea523', // India market
      ],
      'Pakistan': [
        'photo-1583911860205-72f8ac8ddcbe', // Pakistan mountains
        'photo-1570795591508-42e69c0f6d14', // Pakistan valley
        'photo-1570168007204-dfb528c6958f', // Pakistan landscape
      ],
      'Hong Kong': [
        'photo-1536599018102-9f803c140fc1', // Hong Kong skyline
        'photo-1518416177092-ec985e4d6c14', // Hong Kong harbor
        'photo-1519501025264-65ba15a82390', // Hong Kong night
      ],

      // Americas
      'New York': [
        'photo-1496442226666-8d4d0e62e6e9', // NYC skyline
        'photo-1518391846015-55a9cc003b25', // Brooklyn Bridge
        'photo-1538970272646-f61fabb3a8a2', // Times Square
      ],
      'Los Angeles': [
        'photo-1534190239940-9ba8944ea261', // LA cityscape
        'photo-1542856204-00101eb6def4', // Hollywood sign
        'photo-1515896769750-31548aa180ed', // Santa Monica
      ],
      'San Francisco': [
        'photo-1506146332389-18140dc7b2fb', // Golden Gate
        'photo-1517713982677-1c0c16d0c7e6', // SF cityscape
        'photo-1501594907352-04cda38ebc29', // Alamo Square
      ],
      'Miami': [
        'photo-1533106418989-88406c7cc8ca', // Miami beach
        'photo-1514214246283-d427a95c5d2f', // Miami skyline
        'photo-1506812574058-fc75fa93fead', // South Beach
      ],
      'Brazil': [
        'photo-1483729558449-99ef09a8c325', // Rio Christ statue
        'photo-1516306580623-2d3d5a5e5a0e', // Rio beach
        'photo-1483729558449-99ef09a8c325', // Rio cityscape
      ],
      'Mexico': [
        'photo-1518638150340-f706e86654de', // Mexico pyramids
        'photo-1512813195386-6cf811ad3542', // Mexico beach
        'photo-1569329154-7cfd00f377eb', // Mexico architecture
      ],

      // Oceania
      'Sydney': [
        'photo-1506973035872-a4ec16b8e8d9', // Sydney Opera House
        'photo-1524293368565-c4fc41a4f32e', // Sydney Harbour
        'photo-1523059623039-a9ed027e7fad', // Bondi Beach
      ],
      'Australia': [
        'photo-1506973035872-a4ec16b8e8d9', // Sydney Opera House
        'photo-1524293368565-c4fc41a4f32e', // Sydney Harbour
        'photo-1523059623039-a9ed027e7fad', // Bondi Beach
      ],

      // Default travel images for unmapped destinations
      'default': [
        'photo-1488646953014-85cb44e25828', // Travel adventure
        'photo-1476514525535-07fb3b4ae5f1', // Beach sunset
        'photo-1469854523086-cc02fe5d8800', // Mountain landscape
      ]
    };

    // Get array of images for this destination
    const images = destinationImages[normalizedDestination] || destinationImages['default'];

    // Use option.pace to determine which image variant to show
    let imageIndex = 0;
    if (option.pace === 'slow') imageIndex = 0;
    else if (option.pace === 'moderate') imageIndex = 1;
    else if (option.pace === 'fast') imageIndex = 2;

    const photoId = images[imageIndex] || images[0];

    // Return Unsplash CDN URL with photo ID
    return `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`;
  };

  // Build features list similar to TripTap's fare features
  const features = [
    {
      icon: '✈️',
      text: option.pace === 'slow'
        ? 'Leisurely pacing with free time'
        : option.pace === 'moderate'
        ? 'Balanced activity schedule'
        : 'Action-packed daily itinerary'
    },
    {
      icon: '🎯',
      text: `${option.total_days || 0} days of curated experiences`
    },
    {
      icon: '🏨',
      text: option.estimated_total_cost < 2000
        ? 'Budget-friendly accommodations'
        : option.estimated_total_cost < 4000
        ? 'Comfortable mid-range stays'
        : 'Premium luxury accommodations'
    },
    {
      icon: '🍽️',
      text: 'Local cuisine & dining experiences included'
    },
    {
      icon: '🎒',
      text: option.itinerary && option.itinerary.length > 0
        ? `${option.itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)} activities planned`
        : option.pace === 'slow' ? '2 activities per day' : option.pace === 'moderate' ? '3 activities per day' : '4 activities per day'
    },
    {
      icon: '🗺️',
      text: option.pace === 'slow'
        ? 'Flexible schedule with spontaneity'
        : option.pace === 'moderate'
        ? 'Structured yet comfortable timing'
        : 'Optimized for maximum exploration'
    }
  ];

  return (
    <div
      className={`trip-iteration-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      {/* Image Section */}
      <div className="trip-iteration-card__image-section">
        <img
          src={getDestinationImage()}
          alt={destination?.name || 'Trip destination'}
          className="trip-iteration-card__image"
          loading="lazy"
        />
        <div className="trip-iteration-card__image-overlay">
          <div className="trip-iteration-card__destination-badge">
            📍 {destination?.name || 'Destination'}
          </div>
        </div>
      </div>

      {/* Header Section - Similar to TripTap's fare card header */}
      <div className="trip-iteration-card__header">
        {/* Selection Indicator */}
        <div className="trip-iteration-card__selection-indicator">
          {isSelected && (
            <div className="trip-iteration-card__selection-indicator-check">
              ✓
            </div>
          )}
        </div>

        {/* Title */}
        <div className="trip-iteration-card__title-wrapper">
          <p className="trip-iteration-card__subtitle">
            {option.pace?.charAt(0).toUpperCase() + option.pace?.slice(1)} Pace
          </p>
          <h3 className="trip-iteration-card__title">
            {option.title || 'Trip Plan'}
          </h3>
        </div>
      </div>

      {/* Features List - Similar to TripTap's features section */}
      <div className="trip-iteration-card__features">
        {features.map((feature, index) => (
          <div key={index} className="trip-iteration-card__feature">
            <span className="trip-iteration-card__feature-icon">
              {feature.icon}
            </span>
            <p className="trip-iteration-card__feature-text">
              {feature.text}
            </p>
          </div>
        ))}
      </div>

      {/* Price Footer - Similar to TripTap's price section */}
      <div className="trip-iteration-card__footer">
        <p className="trip-iteration-card__price">
          ${option.estimated_total_cost?.toLocaleString() || '0'}
        </p>
        <p className="trip-iteration-card__price-label">
          Total estimated cost
        </p>
        <div className="trip-iteration-card__duration-badge">
          🕐 {option.total_days} {option.total_days === 1 ? 'Day' : 'Days'}
        </div>
      </div>
    </div>
  );
};

export default TripIterationCard;
