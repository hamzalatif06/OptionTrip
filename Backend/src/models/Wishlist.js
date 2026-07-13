import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  destinationName: { type: String, required: true, trim: true },
  country:   { type: String, trim: true, default: '' },
  imageUrl:  { type: String, default: '' },
  notes:     { type: String, trim: true, maxlength: 500, default: '' },
  addedAt:   { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

wishlistSchema.index({ user_id: 1, addedAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
