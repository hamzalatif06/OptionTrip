import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TripPlannerForm.css';
import DestinationAutocomplete from '../GooglePlaces/DestinationAutocomplete';
import { AutocompleteContextProvider } from '../GooglePlaces/AutocompleteContext';
import DateRangePickerComponent from '../DateRangePicker/DateRangePicker';
import GuestSelector from '../GuestSelector/GuestSelector';
import TripTypeSelector from '../TripTypeSelector/TripTypeSelector';
import { generateTripOptions } from '../../services/tripsService';

const TripPlannerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    destination: {
      text: '',
      place_id: '',
      name: '',
      geometry: null
    },
    start_date: '',
    end_date: '',
    duration_days: 0,
    month_year: '',
    tripType: '',
    guests: {
      total: 0,
      adults: 0,
      children: 0,
      infants: 0,
      label: ''
    },
    budget: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for pre-selected destination from TopDestinations or other sources
  useEffect(() => {
    const checkForPreselectedDestination = () => {
      // Check sessionStorage for destination selected from TopDestinations
      const storedDestination = sessionStorage.getItem('selectedDestination');

      if (storedDestination) {
        try {
          const destinationData = JSON.parse(storedDestination);
          setFormData(prev => ({
            ...prev,
            destination: {
              text: destinationData.text || '',
              place_id: destinationData.place_id || '',
              name: destinationData.name || '',
              geometry: destinationData.geometry || null
            }
          }));
          // Clear the stored destination after using it
          sessionStorage.removeItem('selectedDestination');
        } catch (error) {
          console.error('Error parsing stored destination:', error);
          sessionStorage.removeItem('selectedDestination');
        }
      }

      // Also check for destination passed via navigation state
      if (location.state?.destination) {
        const dest = location.state.destination;
        setFormData(prev => ({
          ...prev,
          destination: {
            text: `${dest.city}, ${dest.country}`,
            place_id: '',
            name: dest.city,
            geometry: null
          }
        }));
      }
    };

    checkForPreselectedDestination();
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateRangeChange = (dateData) => {
    setFormData(prev => ({
      ...prev,
      start_date: dateData.start_date,
      end_date: dateData.end_date,
      duration_days: dateData.duration_days,
      month_year: dateData.month_year
    }));

    // Clear error when dates are selected
    if (errors.dates) {
      setErrors(prev => ({ ...prev, dates: '' }));
    }
  };

  const handleGuestsChange = (guestData) => {
    setFormData(prev => ({
      ...prev,
      guests: guestData
    }));

    // Clear error when guests are selected
    if (errors.guests) {
      setErrors(prev => ({ ...prev, guests: '' }));
    }
  };

  const handleTripTypeChange = (tripType) => {
    setFormData(prev => ({
      ...prev,
      tripType: tripType
    }));

    // Clear error when trip type is entered
    if (errors.tripType) {
      setErrors(prev => ({ ...prev, tripType: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!formData.destination?.text) newErrors.destination = 'Destination is required';

    // Date validation (2-10 days like TripTap)
    if (!formData.start_date || !formData.end_date) {
      newErrors.dates = 'Dates are required';
    } else if (formData.duration_days < 2 || formData.duration_days > 10) {
      newErrors.dates = 'Duration must be between 2 and 10 days';
    }

    if (!formData.tripType) newErrors.tripType = 'Trip type is required';

    // Guest validation (at least 1 guest, max 10 like TripTap)
    if (formData.guests.total === 0) {
      newErrors.guests = 'Please select at least 1 guest';
    } else if (formData.guests.total > 10) {
      newErrors.guests = 'Maximum 10 guests allowed';
    }

    if (!formData.budget) newErrors.budget = 'Budget is required';
    if (!formData.description) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // PHASE 1: Generate lightweight trip options (FAST ~10 seconds)
    try {
      setIsSubmitting(true);

      const response = await generateTripOptions(formData);

      if (response.success && response.data?.trip_id) {
        // Navigate to trip options page
        navigate(`/trips/${response.data.trip_id}`);
      } else {
        setErrors({ submit: 'Failed to generate trip options. Please try again.' });
      }
    } catch (error) {
      console.error('Error generating trip options:', error);
      setErrors({ submit: error.message || 'Failed to generate trip options. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="trip-planner-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Destination */}
        <div className="form-field">
          <AutocompleteContextProvider map_id="map">
            <DestinationAutocomplete
              value={formData.destination}
              onChange={(placeData) => {
                setFormData(prev => ({
                  ...prev,
                  destination: placeData
                }));
                if (errors.destination) {
                  setErrors(prev => ({ ...prev, destination: '' }));
                }
              }}
              error={errors.destination}
              placeholder="e.g. Paris, France"
            />
          </AutocompleteContextProvider>
        </div>

        {/* Dates */}
        <div className="form-field">
          <DateRangePickerComponent
            selectedDates={[formData.start_date, formData.end_date]}
            onDateRangeChange={handleDateRangeChange}
            error={errors.dates}
          />
        </div>

        {/* Trip Type */}
        <div className="form-field">
          <TripTypeSelector
            value={formData.tripType}
            onChange={handleTripTypeChange}
            error={errors.tripType}
          />
        </div>

        {/* Guests */}
        <div className="form-field">
          <GuestSelector
            initialGuests={{
              adults: formData.guests.adults,
              children: formData.guests.children,
              infants: formData.guests.infants
            }}
            onGuestsChange={handleGuestsChange}
            error={errors.guests}
          />
        </div>

        {/* Budget */}
        <div className="form-field">
          <label htmlFor="budget">Budget</label>
          <div className="select-wrapper">
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              className={errors.budget ? 'error' : ''}
            >
              <option value="">Select budget</option>
              <option value="budget">Budget ($)</option>
              <option value="moderate">Moderate ($$)</option>
              <option value="luxury">Luxury ($$$)</option>
              <option value="premium">Premium ($$$$)</option>
            </select>
            <i className="fas fa-chevron-down select-arrow"></i>
          </div>
          {errors.budget && <span className="error-message">{errors.budget}</span>}
        </div>

        {/* Description */}
        <div className="form-field form-field-full">
          <label htmlFor="description">Description</label>
          <div className="description-wrapper">
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g. We love hiking, trying local cuisine, and exploring art galleries."
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            <div className="sparkle-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="url(#sparkleGradient)"/>
                <defs>
                  <linearGradient id="sparkleGradient" x1="12" y1="2" x2="12" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0A539D"/>
                    <stop offset="1" stopColor="#F30F89"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
      </div>

      {/* Search Button */}
      <div className="form-actions">
        {errors.submit && <span className="error-message" style={{marginBottom: '12px', display: 'block', textAlign: 'center'}}>{errors.submit}</span>}
        <button type="submit" className={`search-button ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="btn-spinner"></span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Generate Trip</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TripPlannerForm;

