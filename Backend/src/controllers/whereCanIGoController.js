/**
 * Where Can I Go? controller
 *
 * Endpoints
 *   GET  /api/where-can-i-go/passports          — list supported nationalities
 *   GET  /api/where-can-i-go/destinations       — filtered/sorted destination list
 *                                                  ?passport=PAK&hideEmbassy=1&halal=1&sortBy=easy
 *   GET  /api/where-can-i-go/destination/:code  — full detail card for one country
 *   PATCH /api/where-can-i-go/passport          — persist the user's nationality (auth)
 */

import {
  listPassports,
  listDestinationsFor,
  getDestinationDetail
} from '../services/whereCanIGoService.js';
import User from '../models/User.js';

const parseBool = (v) => v === '1' || v === 'true' || v === true;

export const getPassports = async (_req, res) => {
  try {
    return res.status(200).json({ success: true, data: { passports: listPassports() } });
  } catch (err) {
    console.error('getPassports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load passports' });
  }
};

export const getDestinations = async (req, res) => {
  try {
    const passport = (req.query.passport || req.user?.nationality || '').toUpperCase();
    if (!passport) {
      return res.status(400).json({ success: false, message: 'passport code is required' });
    }

    const comfort = {
      halal:        parseBool(req.query.halal),
      prayer:       parseBool(req.query.prayer),
      conservative: parseBool(req.query.conservative),
      women_solo:   parseBool(req.query.women_solo)
    };

    const result = listDestinationsFor(passport, {
      hideEmbassy: parseBool(req.query.hideEmbassy),
      comfort,
      sortBy:      req.query.sortBy || 'easy'
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('getDestinations error:', err);
    return res.status(status).json({ success: false, message: err.message || 'Failed to load destinations' });
  }
};

export const getDestination = async (req, res) => {
  try {
    const passport = (req.query.passport || req.user?.nationality || '').toUpperCase();
    const code     = (req.params.code || '').toUpperCase();
    if (!passport) {
      return res.status(400).json({ success: false, message: 'passport code is required' });
    }

    const detail = getDestinationDetail(passport, code);
    return res.status(200).json({ success: true, data: detail });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('getDestination error:', err);
    return res.status(status).json({ success: false, message: err.message || 'Failed to load destination' });
  }
};

export const setPassport = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Sign in to save your passport' });
    }
    const code = (req.body?.nationality || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'nationality must be an ISO-3 country code' });
    }
    // Ensure the code is one we know about — otherwise reject
    if (!listPassports().some(p => p.code === code)) {
      return res.status(400).json({ success: false, message: 'Unsupported passport code' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { nationality: code } },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, data: { nationality: user?.nationality || code } });
  } catch (err) {
    console.error('setPassport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save passport' });
  }
};

export default { getPassports, getDestinations, getDestination, setPassport };
