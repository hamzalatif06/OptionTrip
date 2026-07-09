import express from 'express';
import Wishlist from '../models/Wishlist.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wishlist — list all wishlist items for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await Wishlist.find({ user_id: req.user._id }).sort({ addedAt: -1 });
    res.json({ success: true, data: { items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wishlist — add a destination to wishlist
router.post('/', authenticate, async (req, res) => {
  try {
    const { destinationName, country, imageUrl, notes } = req.body;
    if (!destinationName) {
      return res.status(400).json({ success: false, message: 'destinationName is required' });
    }
    const item = await Wishlist.create({
      user_id: req.user._id,
      destinationName,
      country: country || '',
      imageUrl: imageUrl || '',
      notes: notes || ''
    });
    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/wishlist/:id — remove a wishlist item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await Wishlist.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!result) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
