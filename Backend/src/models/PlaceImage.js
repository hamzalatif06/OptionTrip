import mongoose from 'mongoose';

const placeImageSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  
  placeName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  
  images: [{
    photoReference: String,
    url: {
      type: String,
      required: true
    },
    attribution: String,
    width: Number,
    height: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  primaryImageUrl: {
    type: String,
    required: true
  },
  
  source: {
    type: String,
    enum: ['google-places', 'fallback', 'cached'],
    default: 'google-places'
  },
  
  placeDetails: {
    displayName: String,
    formattedAddress: String,
    latitude: Number,
    longitude: Number,
    rating: Number,
    userRatingsTotal: Number,
    types: [String],
    website: String,
    phone: String
  },
  
  cacheMetadata: {
    fetchCount: {
      type: Number,
      default: 0
    },
    lastFetched: {
      type: Date,
      default: Date.now
    },
    nextRefreshDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  },
  
  fallbackImages: [String],
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  lastError: {
    error: String,
    timestamp: Date
  }
}, {
  timestamps: true,
  indexes: [
    { placeId: 1, isActive: 1 },
    { placeName: 1, isActive: 1 },
    { 'cacheMetadata.expiresAt': 1 }
  ]
});

placeImageSchema.index({ 'cacheMetadata.expiresAt': 1 }, { expireAfterSeconds: 0 });

placeImageSchema.methods.getRandomImage = function() {
  return this.primaryImageUrl;
};

placeImageSchema.methods.incrementFetchCount = async function() {
  this.cacheMetadata.fetchCount += 1;
  this.cacheMetadata.lastFetched = new Date();
  return this.save();
};

placeImageSchema.statics.getCachedImage = async function(placeId) {
  const placeImage = await this.findOne({
    placeId,
    isActive: true,
    'cacheMetadata.expiresAt': { $gt: new Date() }
  });

  if (placeImage) {
    placeImage.incrementFetchCount().catch(() => {});
  }

  return placeImage;
};

const PlaceImage = mongoose.model('PlaceImage', placeImageSchema);

export default PlaceImage;
