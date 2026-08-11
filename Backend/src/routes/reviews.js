import express from 'express';
import Review from '../models/Review.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { destination, page = 1, limit = 20 } = req.query;
    if (!destination) return res.status(400).json({ success: false, message: 'destination query param required' });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { destinationName: { $regex: new RegExp(`^${destination}$`, 'i') } };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name avatar'),
      Review.countDocuments(query)
    ]);

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ success: true, data: { reviews, total, avgRating: Math.round(avgRating * 10) / 10 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { destinationName, country, rating, text, tripId } = req.body;
    if (!destinationName || !rating || !text) {
      return res.status(400).json({ success: false, message: 'destinationName, rating, and text are required' });
    }

    const review = new Review({
      userId: req.user._id,
      destinationName: destinationName.trim(),
      country: country?.trim(),
      rating: parseInt(rating),
      text: text.trim(),
      tripId
    });

    await review.save();
    await review.populate('userId', 'name avatar');
    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this destination' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
