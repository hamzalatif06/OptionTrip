import mongoose from 'mongoose';

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
      'trip', 'flight', 'hotel', 'car', 'esim', 'tours', 'plan_my_day',
      'page', 'profile', 'chat', 'destination', 'misc'
    ],
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  title: {
    type: String,
    trim: true,
    maxlength: 240,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
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
