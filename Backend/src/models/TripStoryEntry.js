import mongoose from 'mongoose';

const tripStoryEntrySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trip_id: { type: String, index: true },
  location: {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  text: { type: String, required: true, trim: true, maxlength: 600 },
  mediaLinks: [{
    url: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'tiktok', 'instagram', 'facebook', 'twitter', 'other'], default: 'other' },
    previewTitle: { type: String, default: null },
    previewThumbnail: { type: String, default: null }
  }],
  sourceType: { type: String, enum: ['voice', 'text'], default: 'text' },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

tripStoryEntrySchema.index({ 'location.city': 1, createdAt: -1 });
tripStoryEntrySchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model('TripStoryEntry', tripStoryEntrySchema);
