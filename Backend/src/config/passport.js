import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

/**
 * Configure JWT Strategy for protecting routes
 */
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

/**
 * Configure Google OAuth Strategy (optional - only if credentials provided)
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreateFromOAuth('google', profile);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth Strategy initialized');
} else {
  console.log('ℹ️  Google OAuth not configured (optional)');
}

/**
 * Configure Facebook OAuth Strategy (optional - only if credentials provided)
 */
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.API_BASE_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
        enableProof: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreateFromOAuth('facebook', profile);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Facebook OAuth Strategy initialized');
} else {
  console.log('ℹ️  Facebook OAuth not configured (optional)');
}

/**
 * Configure Twitter OAuth Strategy (optional - only if credentials provided)
 */
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  // Twitter doesn't support localhost, use 127.0.0.1 instead
  const twitterCallbackURL = process.env.TWITTER_CALLBACK_URL ||
    (process.env.API_BASE_URL?.replace('localhost', '127.0.0.1') + '/api/auth/twitter/callback');

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: twitterCallbackURL,
        includeEmail: true,
        userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true'
      },
      async (token, tokenSecret, profile, done) => {
        try {
          const user = await User.findOrCreateFromOAuth('twitter', profile);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Twitter OAuth Strategy initialized');
} else {
  console.log('ℹ️  Twitter OAuth not configured (optional)');
}

/**
 * Serialize user for session (not used with JWT, but required by Passport)
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
