/**
 * Where Can I Go? routes
 */

import express from 'express';
import {
  getPassports,
  getDestinations,
  getDestination,
  setPassport
} from '../controllers/whereCanIGoController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Public — passport list is static
router.get('/passports', getPassports);

// Optional auth — if signed in, we can fall back to req.user.nationality
router.get('/destinations',        optionalAuthenticate, getDestinations);
router.get('/destination/:code',   optionalAuthenticate, getDestination);

// Auth required — persist nationality to profile
router.patch('/passport', authenticate, setPassport);

export default router;
