import mongoose from 'mongoose';

const userMemoryProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 1500,
    default: ''
  },
  facts: {
    home_base:          { type: String, default: null },
    favorite_destinations: { type: [String], default: [] },
    avoided_or_disliked:   { type: [String], default: [] },
    trip_types:            { type: [String], default: [] },
    typical_budget:        { type: String, default: null },
    typical_party_size:    { type: Number, default: null },
    interests:             { type: [String], default: [] },
    dietary:               { type: [String], default: [] },
    notable_quotes:        { type: [String], default: [] },
    upsell_suggested_at: {
      esim:  { type: Date, default: null },
      car:   { type: Date, default: null },
      hotel: { type: Date, default: null },
      tours: { type: Date, default: null }
    }
  },
  stats: {
    lastSummarizedAt:      { type: Date, default: null },
    lastActivityCursor:    { type: mongoose.Schema.Types.ObjectId, default: null },
    lastConversationCursor: { type: Date, default: null },
    totalTripsSeen:        { type: Number, default: 0 },
    totalActivitiesSeen:   { type: Number, default: 0 }
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

const UserMemoryProfile = mongoose.model('UserMemoryProfile', userMemoryProfileSchema);
export default UserMemoryProfile;
