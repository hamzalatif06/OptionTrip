import mongoose from 'mongoose';

const blogImageOverrideSchema = new mongoose.Schema({
  postId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  slug: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('BlogImageOverride', blogImageOverrideSchema);
