import mongoose from 'mongoose';

const placeImageSchema = new mongoose.Schema({
  // Unique identifier for the place
  placeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  
  // Place name/query (e.g., 'Dubai', 'Paris', 'New York')
  placeName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  
  // Google Places API photo references and URLs
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
  
  // Primary/featured image URL (most recent or best quality)
  primaryImageUrl: {
    type: String,
    required: true
  },
  
  // Source information
  source: {
    type: String,
    enum: ['google-places', 'fallback', 'cached'],
    default: 'google-places'
  },
  
  // Place details from Google Places API
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
  
  // Cache metadata
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
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  },
  
  // Fallback images (local images if API fails)
  fallbackImages: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Error tracking
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

// Automatically delete expired documents after 90 days
placeImageSchema.index({ 'cacheMetadata.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Return the primary image — always consistent, no random variation across requests
placeImageSchema.methods.getRandomImage = function() {
  return this.primaryImageUrl;
};

// Method to increment fetch count
placeImageSchema.methods.incrementFetchCount = async function() {
  this.cacheMetadata.fetchCount += 1;
  this.cacheMetadata.lastFetched = new Date();
  return this.save();
};

// Static method to get or create place image
placeImageSchema.statics.getOrCreatePlaceImage = async function(placeId, placeName) {
  let placeImage = await this.findOne({ 
    placeId, 
    isActive: true 
  });
  
  if (!placeImage) {
    placeImage = new this({
      placeId,
      placeName: placeName.toLowerCase(),
      primaryImageUrl: '',
      images: []
    });
  }
  
  return placeImage;
};

// Static method to get cached image
placeImageSchema.statics.getCachedImage = async function(placeId) {
  const placeImage = await this.findOne({
    placeId,
    isActive: true,
    'cacheMetadata.expiresAt': { $gt: new Date() }
  });

  // Fire-and-forget: don't block the response on a stat write
  if (placeImage) {
    placeImage.incrementFetchCount().catch(() => {});
  }

  return placeImage;
};

// Static method to cache needs refresh
placeImageSchema.statics.needsRefresh = async function(placeId) {
  const placeImage = await this.findOne({ placeId, isActive: true });
  
  if (!placeImage) return true;
  
  return new Date() > placeImage.cacheMetadata.nextRefreshDate;
};

const PlaceImage = mongoose.model('PlaceImage', placeImageSchema);

export default PlaceImage;
