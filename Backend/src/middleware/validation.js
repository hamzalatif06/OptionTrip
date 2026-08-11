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

  if (!duration_days || typeof duration_days !== 'number') {
    errors.push('duration_days is required and must be a number');
  } else if (duration_days < 2 || duration_days > 10) {
    errors.push('duration_days must be between 2 and 10 days');
  }

  if (guests && typeof guests === 'object' && typeof guests.total === 'number' && guests.total > 10) {
    errors.push('guests.total must be 10 or fewer');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

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

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export const validateFlightSearch = (req, res, next) => {
  const { originCode, destinationCode, departureDate, returnDate, adults } = req.body;
  const errors = [];

  const iataRegex = /^[A-Za-z]{2,3}$/;

  if (!originCode || !iataRegex.test(originCode)) {
    errors.push('originCode is required and must be a valid 2-3 letter IATA airport code (e.g. JFK)');
  }

  if (!destinationCode || !iataRegex.test(destinationCode)) {
    errors.push('destinationCode is required and must be a valid 2-3 letter IATA airport code (e.g. LAX)');
  }

  if (originCode && destinationCode && originCode.toUpperCase() === destinationCode.toUpperCase()) {
    errors.push('originCode and destinationCode must be different');
  }

  if (!departureDate) {
    errors.push('departureDate is required');
  } else if (!isValidDate(departureDate)) {
    errors.push('departureDate must be a valid date in YYYY-MM-DD format');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(departureDate) < today) {
      errors.push('departureDate cannot be in the past');
    }
  }

  if (returnDate) {
    if (!isValidDate(returnDate)) {
      errors.push('returnDate must be a valid date in YYYY-MM-DD format');
    } else if (departureDate && new Date(returnDate) <= new Date(departureDate)) {
      errors.push('returnDate must be after departureDate');
    }
  }

  const adultsNum = Number(adults);
  if (!adults && adults !== 0) {
    errors.push('adults is required');
  } else if (!Number.isInteger(adultsNum) || adultsNum < 1 || adultsNum > 9) {
    errors.push('adults must be an integer between 1 and 9');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateHotelSearch = (req, res, next) => {
  const { cityCode, checkIn, checkOut, adults } = req.query;
  const errors = [];

  const codeRegex = /^[A-Za-z]{2,3}$/;
  if (!cityCode || !codeRegex.test(cityCode.trim())) {
    errors.push('cityCode is required and must be a valid 2-3 letter IATA city code (e.g. PAR)');
  }

  if (!checkIn) {
    errors.push('checkIn is required');
  } else if (!isValidDate(checkIn)) {
    errors.push('checkIn must be a valid date in YYYY-MM-DD format');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(checkIn) < today) {
      errors.push('checkIn cannot be in the past');
    }
  }

  if (!checkOut) {
    errors.push('checkOut is required');
  } else if (!isValidDate(checkOut)) {
    errors.push('checkOut must be a valid date in YYYY-MM-DD format');
  } else if (checkIn && isValidDate(checkIn) && new Date(checkOut) <= new Date(checkIn)) {
    errors.push('checkOut must be after checkIn');
  }

  const adultsNum = Number(adults);
  if (!adults && adults !== 0) {
    errors.push('adults is required');
  } else if (!Number.isInteger(adultsNum) || adultsNum < 1 || adultsNum > 9) {
    errors.push('adults must be an integer between 1 and 9');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

export const validateTPFlightSearch = (req, res, next) => {
  const { origin, destination, departureAt } = req.query;
  const errors = [];
  const iataRe = /^[A-Za-z]{2,3}$/;

  if (!origin || !iataRe.test(origin)) {
    errors.push('origin must be a 2-3 letter IATA code (e.g. LHR)');
  }
  if (!destination || !iataRe.test(destination)) {
    errors.push('destination must be a 2-3 letter IATA code (e.g. DXB)');
  }
  if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
    errors.push('origin and destination must differ');
  }
  if (!departureAt || !/^\d{4}-\d{2}-\d{2}$/.test(departureAt)) {
    errors.push('departureAt must be in YYYY-MM-DD format');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join('; ') });
  }
  next();
};

export default {
  validateTripGeneration,
  validateTripId,
  validateOptionSelection,
  validateFlightSearch,
  validateHotelSearch,
  validateTPFlightSearch,
};
