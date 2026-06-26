import mongoose from 'mongoose';

const visitedLocationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    trip_id: { type: String },
    name: { type: String, required: true },
    city: { type: String },
    country: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    category: {
      type: String,
      enum: ['destination', 'sightseeing', 'dining', 'adventure', 'culture', 'nature', 'beach', 'other'],
      default: 'destination'
    },
    visited_at: { type: Date, default: Date.now },
    notes: { type: String, maxlength: 500 },
    image: { type: String }
  },
  { timestamps: true }
);

visitedLocationSchema.index({ user_id: 1, visited_at: -1 });

export default mongoose.model('VisitedLocation', visitedLocationSchema);
