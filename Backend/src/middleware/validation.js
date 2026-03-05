/**
 * Validation Middleware
 * Validates incoming requests for trip generation
 */

/**
 * Validate trip generation request
 */
export const validateTripGeneration = (req, res, next) => {
  const {
    destination,
    start_date,
    end_date,
    duration_days,
    tripType,
    guests,
    budget,
    description
  } = req.body;

  const errors = [];

  // Destination validation
  if (!destination || typeof destination !== 'object') {
    errors.push('destination is required and must be an object');
  } else {
    if (!destination.text || typeof destination.text !== 'string') {
      errors.push('destination.text is required');
    }
    if (!destination.name || typeof destination.name !== 'string') {
      errors.push('destination.name is required');
    }
  }

  // Dates validation
  if (!start_date) {
    errors.push('start_date is required');
  } else if (!isValidDate(start_date)) {
    errors.push('start_date must be a valid date in YYYY-MM-DD format');
  }

  if (!end_date) {
    errors.push('end_date is required');
  } else if (!isValidDate(end_date)) {
    errors.push('end_date must be a valid date in YYYY-MM-DD format');
  }

  // Duration validation
  if (!duration_days || typeof duration_days !== 'number') {
    errors.push('duration_days is required and must be a number');
  } else if (duration_days < 2 || duration_days > 10) {
    errors.push('duration_days must be between 2 and 10 days');
  }

  // Guests validation (optional — only validate max if provided)
  if (guests && typeof guests === 'object' && typeof guests.total === 'number' && guests.total > 10) {
    errors.push('guests.total must be 10 or fewer');
  }

  // If there are validation errors, return 400
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // All validation passed
  next();
};

/**
 * Validate trip ID parameter
 */
export const validateTripId = (req, res, next) => {
  const { tripId } = req.params;

  if (!tripId || typeof tripId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid trip ID'
    });
  }

  next();
};

/**
 * Validate option selection request
 */
export const validateOptionSelection = (req, res, next) => {
  const { option_id } = req.body;

  if (!option_id || typeof option_id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'option_id is required and must be a string'
    });
  }

  next();
};

/**
 * Helper function to validate date format
 */
const isValidDate = (dateString) => {
  // Check format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export default {
  validateTripGeneration,
  validateTripId,
  validateOptionSelection
};
