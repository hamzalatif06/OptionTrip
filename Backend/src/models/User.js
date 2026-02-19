import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    select: false // Don't include password in queries by default
  },
  phoneNumber: {
    type: String,
    default: null,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  profileImage: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // Multi-provider support
  authProviders: [{
    type: String,
    enum: ['local', 'google', 'facebook', 'twitter']
  }],
  // Provider-specific IDs
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  twitterId: {
    type: String,
    sparse: true,
    unique: true
  },
  // Refresh token for JWT rotation
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d' // Auto-delete after 30 days
    }
  }],
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.passwordHash;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ twitterId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function() {
  // Only hash password if it's modified or new
  if (!this.isModified('passwordHash')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to add auth provider
userSchema.methods.addAuthProvider = function(provider) {
  if (!this.authProviders.includes(provider)) {
    this.authProviders.push(provider);
  }
};

// Method to check if provider is linked
userSchema.methods.hasProvider = function(provider) {
  return this.authProviders.includes(provider);
};

// Static method to find user by any provider
userSchema.statics.findByProvider = async function(provider, providerId) {
  const query = {};

  switch(provider) {
    case 'google':
      query.googleId = providerId;
      break;
    case 'facebook':
      query.facebookId = providerId;
      break;
    case 'twitter':
      query.twitterId = providerId;
      break;
    default:
      return null;
  }

  return await this.findOne(query);
};

// Helper to extract profile image from OAuth profile
const extractProfileImage = (profile) => {
  // Try different locations where providers store the photo
  if (profile.photos && profile.photos.length > 0) {
    return profile.photos[0].value;
  }
  // Google stores high-res image in _json.picture
  if (profile._json && profile._json.picture) {
    return profile._json.picture;
  }
  // Some providers use profile.picture directly
  if (profile.picture) {
    return profile.picture;
  }
  return null;
};

// Static method to find or create user from OAuth profile
userSchema.statics.findOrCreateFromOAuth = async function(provider, profile) {
  try {
    // Extract email from profile (provider-specific)
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    } else if (profile.email) {
      email = profile.email;
    }

    // Extract profile image
    const profileImage = extractProfileImage(profile);

    // Try to find user by provider ID first
    let user = await this.findByProvider(provider, profile.id);

    if (user) {
      // Update last login and profile image from OAuth provider
      user.lastLogin = new Date();
      user.addAuthProvider(provider);

      // Always update profile image from OAuth if available and user doesn't have a custom uploaded one
      if (profileImage && (!user.profileImage || user.profileImage.includes('googleusercontent') || user.profileImage.includes('facebook') || user.profileImage.includes('twimg'))) {
        user.profileImage = profileImage;
      }

      await user.save();
      return user;
    }

    // If no user found by provider ID, try by email
    if (email) {
      user = await this.findOne({ email });

      if (user) {
        // Link this provider to existing account
        user[`${provider}Id`] = profile.id;
        user.addAuthProvider(provider);

        // Update profile image if not set or is from OAuth provider
        if (profileImage && (!user.profileImage || user.profileImage.includes('googleusercontent') || user.profileImage.includes('facebook') || user.profileImage.includes('twimg'))) {
          user.profileImage = profileImage;
        }

        // Verify email if provider confirms it
        if (profile.email_verified || profile.verified || profile._json?.email_verified) {
          user.emailVerified = true;
        }

        user.lastLogin = new Date();
        await user.save();
        return user;
      }
    }

    // Create new user
    const newUser = new this({
      name: profile.displayName || profile.username || 'User',
      email: email || `${provider}_${profile.id}@placeholder.com`,
      [`${provider}Id`]: profile.id,
      authProviders: [provider],
      profileImage: profileImage,
      emailVerified: profile.email_verified || profile.verified || profile._json?.email_verified || false,
      lastLogin: new Date()
    });

    await newUser.save();
    return newUser;
  } catch (error) {
    throw new Error(`Error in findOrCreateFromOAuth: ${error.message}`);
  }
};

const User = mongoose.model('User', userSchema);

export default User;
