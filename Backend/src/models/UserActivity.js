import mongoose from 'mongoose';

/**
 * UserActivity — captures meaningful things a signed-in user does on the
 * platform (trip creation, search, plan generation, page visits, etc.).
 * Used to feed the Vi AI assistant with concrete, recent context so it can
 * give sharper, more personal recommendations.
 *
 * `fed_to_assistant` flips to true the moment an activity is injected into a
 * chat system prompt, so we don't re-feed the same history on every turn.
 */
const userActivitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'trip', 'flight', 'hotel', 'car', 'plan_my_day',
      'page', 'profile', 'chat', 'destination', 'misc'
    ],
    index: true
  },
  // 'created' | 'viewed' | 'searched' | 'opened' | 'completed' | etc.
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  // Short, human-readable label that goes straight into the LLM prompt.
  title: {
    type: String,
    trim: true,
    maxlength: 240,
    default: ''
  },
  // Free-form per-type payload (destination, dates, vibe, budget, etc.).
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Snapshot of where the user was when this activity happened (optional).
  location: {
    city: String,
    country: String,
    neighborhood: String,
    lat: Number,
    lng: Number
  },
  fed_to_assistant: {
    type: Boolean,
    default: false,
    index: true
  },
  fed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

userActivitySchema.index({ user_id: 1, createdAt: -1 });
userActivitySchema.index({ user_id: 1, fed_to_assistant: 1, createdAt: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;
