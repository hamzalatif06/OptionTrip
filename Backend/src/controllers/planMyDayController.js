/**
 * Plan My Day Controller
 */

import { generateDayPlan } from '../services/planMyDayService.js';

/**
 * POST /api/plan-my-day/generate
 * Body: {
 *   location:      { city, country, neighborhood, lat, lng },
 *   date:          'YYYY-MM-DD',
 *   startTime:     'HH:MM',
 *   durationHours: number,
 *   vibe:          'foodie'|'cultural'|'adventure'|'relaxed'|'romantic'|'family'|'local'|'nightlife'|'workcafe',
 *   budget:        'budget'|'moderate'|'premium'|'luxury',
 *   interests:     string[],
 *   partySize:     number
 * }
 */
export const generate = async (req, res) => {
  try {
    const {
      location, date, startTime, durationHours,
      vibe, budget, interests, partySize
    } = req.body || {};

    if (!location || (!location.city && (typeof location.lat !== 'number' || typeof location.lng !== 'number'))) {
      return res.status(400).json({
        success: false,
        message: 'A location (city or coordinates) is required.'
      });
    }

    const today = new Date();
    const dateISO = date || today.toISOString().slice(0, 10);

    const result = await generateDayPlan({
      location,
      dateISO,
      startTime:    startTime || '10:00',
      durationHours: Math.min(Math.max(Number(durationHours) || 8, 3), 16),
      vibe:         vibe      || 'local',
      budget:       budget    || 'moderate',
      interests:    Array.isArray(interests) ? interests.slice(0, 8) : [],
      partySize:    Math.min(Math.max(Number(partySize) || 1, 1), 12)
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Plan My Day controller error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate day plan',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export default { generate };
