import React from 'react';
import './TripBanner.css';

const TripBanner = ({
  isLoading = false,
  isSuccess = true,
  error = null,
  data = {},
  onSave = null,
  isSaved = false,
  isSaving = false,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  const getDestinationImage = () => {
    const destinationImages = {
      'Paris': 'photo-1502602898657-3e91760cbb34',
      'London': 'photo-1513635269975-59663e0ac1ad',
      'Rome': 'photo-1552832230-c0197dd311b5',
      'Barcelona': 'photo-1583422409516-2895a77efded',
      'Amsterdam': 'photo-1534351590666-13e3e96b5017',
      'Istanbul': 'photo-1524231757912-21f4fe3a7200',
      'Prague': 'photo-1592906209472-a36b1f3782ef',
      'Venice': 'photo-1514890547357-a9ee288728e0',
      'Athens': 'photo-1555993539-1732b0258235',
      'Moscow': 'photo-1513326738677-b964603b136d',
      'Russia': 'photo-1513326738677-b964603b136d',

      'Tokyo': 'photo-1540959733332-eab4deabeeaf',
      'Dubai': 'photo-1512453979798-5ea266f8880c',
      'Singapore': 'photo-1525625293386-3f8f99389edd',
      'Bali': 'photo-1537996194471-e657df975ab4',
      'Thailand': 'photo-1552465011-b4e21bf6e79a',
      'Bangkok': 'photo-1528181304800-259b08848526',
      'Hong Kong': 'photo-1536599018102-9f803c140fc1',
      'Seoul': 'photo-1517154421773-0529f29ea451',
      'Beijing': 'photo-1508804185872-d7badad00f7d',
      'Shanghai': 'photo-1548919973-5cef591cdbc9',
      'Vietnam': 'photo-1583417267826-aebc4d1542e1',
      'India': 'photo-1524492412937-b28074a5d7da',
      'Pakistan': 'photo-1583911860205-72f8ac8ddcbe',
      'Nepal': 'photo-1506905925346-21bda4d32df4',
      'Maldives': 'photo-1514282401047-d79a71a590e8',
      'Sri Lanka': 'photo-1566073771259-6a8506099945',

      'New York': 'photo-1496442226666-8d4d0e62e6e9',
      'Los Angeles': 'photo-1534190239940-9ba8944ea261',
      'San Francisco': 'photo-1506146332389-18140dc7b2fb',
      'Miami': 'photo-1533106418989-88406c7cc8ca',
      'Chicago': 'photo-1477959858617-67f85cf4f1df',
      'Las Vegas': 'photo-1506929562872-bb421503ef21',
      'Rio de Janeiro': 'photo-1483729558449-99ef09a8c325',
      'Mexico': 'photo-1518638150340-f706e86654de',
      'Canada': 'photo-1503614472-8c93d56e92ce',
      'Toronto': 'photo-1517935706615-2717063c2225',
      'Vancouver': 'photo-1505935428862-770b6f24f629',
      'Peru': 'photo-1587595431973-160d0d94add1',
      'Argentina': 'photo-1589909202802-8f4aadce1849',
      'Chile': 'photo-1469854523086-cc02fe5d8800',
      'Brazil': 'photo-1483729558449-99ef09a8c325',

      'Sydney': 'photo-1506973035872-a4ec16b8e8d9',
      'Australia': 'photo-1506973035872-a4ec16b8e8d9',
      'Melbourne': 'photo-1514395462725-fb4566210144',
      'New Zealand': 'photo-1507699622108-4be3abd695ad',

      'Cairo': 'photo-1539768942893-daf53e448371',
      'Egypt': 'photo-1539768942893-daf53e448371',
      'Morocco': 'photo-1489749798305-4fea3ae63d43',
      'Kenya': 'photo-1516026672322-bc52d61a55d5',
      'South Africa': 'photo-1484318571209-661cf29a69c3',
      'Israel': 'photo-1544251927-3f0f60b5e78d',
    };

    const normalizedDestination = destinationName.split(',')[0].trim();
    const photoId = destinationImages[normalizedDestination] || 'photo-1488646953014-85cb44e25828';

    return `https://images.unsplash.com/${photoId}?w=1920&h=800&fit=crop&q=80`;
  };

  const backgroundImage = getDestinationImage();

  const metadataTabs = [
    durationDays > 0 ? `${durationDays} Day${durationDays > 1 ? 's' : ''}` : null,
    adultsCount > 0 ? `${adultsCount} Adult${adultsCount > 1 ? 's' : ''}` : null,
    startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : null,
  ].filter(Boolean);

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

        <h1 className="trip-banner__title">
          Your Trip to {destinationName}
        </h1>


        <p className="trip-banner__description">
          {description || `${destinationName}, with its iconic landmarks, rich culture, and vibrant atmosphere, offers an unforgettable experience for travelers worldwide.`}
        </p>


        {metadataTabs.length > 0 && (
          <div className="trip-banner__chips">
            {metadataTabs.map((tab, index) => (
              <div key={index} className="trip-banner__chip">
                {tab}
              </div>
            ))}
          </div>
        )}


        {onSave && (
          <button
            className={`trip-banner__save-btn${isSaved ? ' saved' : ''}`}
            onClick={onSave}
            disabled={isSaved || isSaving}
          >
            {isSaved ? (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                Saved to My Trips
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                Save Trip
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TripBanner;
