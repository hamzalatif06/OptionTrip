import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destinationName: { type: String, required: true, trim: true },
  country: { type: String, trim: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, required: true, maxlength: 1000, trim: true },
  tripId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ destinationName: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, destinationName: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
