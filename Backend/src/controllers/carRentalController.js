import { searchCarLocations, searchCars } from '../services/carRentalService.js';

// GET /api/cars/locations?query=Dubai
export const getCarLocations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2)
      return res.status(400).json({ success: false, message: 'query must be at least 2 characters' });

    const locations = await searchCarLocations(query.trim());
    res.json({ success: true, data: { locations } });
  } catch (err) {
    console.error('❌ Car location error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/cars/search?pickUpPlaceId=...&dropOffPlaceId=...&pickUpDate=...&dropOffDate=...
export const searchCarsHandler = async (req, res) => {
  try {
    const {
      pickUpPlaceId,
      dropOffPlaceId,
      pickUpDate,
      dropOffDate,
      pickUpTime,
      dropOffTime,
      driverAge,
      currency,
    } = req.query;

    if (!pickUpPlaceId || !pickUpDate || !dropOffDate)
      return res.status(400).json({ success: false, message: 'pickUpPlaceId, pickUpDate and dropOffDate are required' });

    const cars = await searchCars({
      pickUpPlaceId,
      dropOffPlaceId,
      pickUpDate,
      dropOffDate,
      pickUpTime:  pickUpTime  || '10:00',
      dropOffTime: dropOffTime || '10:00',
      driverAge:   driverAge   ? Number(driverAge) : 30,
      currency:    currency    || 'USD',
    });

    res.json({ success: true, data: { cars, count: cars.length } });
  } catch (err) {
    console.error('❌ Car search error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
