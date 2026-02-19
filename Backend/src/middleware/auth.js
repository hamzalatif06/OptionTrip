import passport from '../config/passport.js';
import tokenService from '../services/tokenService.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 */
export const optionalAuthenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Middleware to extract and validate refresh token from cookies
 */
export const authenticateRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify token
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    req.refreshToken = refreshToken;
    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

// Alias for backwards compatibility
export const validateRefreshToken = authenticateRefreshToken;

/**
 * Middleware to check if user is active
 */
export const isActive = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated'
    });
  }
  next();
};

/**
 * Middleware to check if email is verified (optional check)
 */
export const isEmailVerified = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address'
    });
  }
  next();
};
