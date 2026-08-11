import express from 'express';
import {
  getPassports,
  getDestinations,
  getDestination,
  setPassport
} from '../controllers/whereCanIGoController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/passports', getPassports);

router.get('/destinations',        optionalAuthenticate, getDestinations);
router.get('/destination/:code',   optionalAuthenticate, getDestination);

router.patch('/passport', authenticate, setPassport);

export default router;
