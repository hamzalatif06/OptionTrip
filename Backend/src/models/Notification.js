import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['trip_reminder', 'service_upsell', 'destination_news', 'system']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  body: {
    type: String,
    trim: true,
    maxlength: 400,
    default: ''
  },
  cta: {
    label: { type: String, default: null },
    url:   { type: String, default: null }
  },
  related: {
    trip_id:     { type: String, default: null },
    destination: { type: String, default: null }
  },
  dedupe_key: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  push_sent: {
    type: Boolean,
    default: false
  },
  push_sent_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

notificationSchema.index({ user_id: 1, status: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, dedupe_key: 1 }, { unique: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
