import express from 'express';
import passport from 'passport';
import authController from '../controllers/authController.js';
import { authenticate, authenticateRefreshToken } from '../middleware/auth.js';
import {
  authRateLimiter,
  strictAuthRateLimiter,
  generalRateLimiter
} from '../middleware/security.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateLinkProvider
} from '../validators/authValidators.js';
import { uploadProfileImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user with email/password
 * @access  Public
 */
router.post(
  '/signup',
  authRateLimiter,
  validateRegister,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/password
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh-token',
  generalRateLimiter,
  authenticateRefreshToken,
  authController.refreshToken
);

// ============================================
// OAUTH ROUTES (Google, Facebook, Twitter)
// Only register routes if OAuth credentials are configured
// ============================================

/**
 * Google OAuth Routes (only if configured)
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  /**
   * @route   GET /api/auth/google
   * @desc    Initiate Google OAuth flow
   * @access  Public
   */
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })
  );

  /**
   * @route   GET /api/auth/google/callback
   * @desc    Google OAuth callback
   * @access  Public
   */
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    authController.oauthCallback
  );
}

/**
 * Facebook OAuth Routes (only if configured)
 */
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  /**
   * @route   GET /api/auth/facebook
   * @desc    Initiate Facebook OAuth flow
   * @access  Public
   */
  router.get(
    '/facebook',
    passport.authenticate('facebook', {
      scope: ['email', 'public_profile'],
      session: false
    })
  );

  /**
   * @route   GET /api/auth/facebook/callback
   * @desc    Facebook OAuth callback
   * @access  Public
   */
  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`
    }),
    authController.oauthCallback
  );
}

/**
 * Twitter OAuth Routes (only if configured)
 */
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  /**
   * @route   GET /api/auth/twitter
   * @desc    Initiate Twitter OAuth flow
   * @access  Public
   */
  router.get(
    '/twitter',
    passport.authenticate('twitter', {
      session: false
    })
  );

  /**
   * @route   GET /api/auth/twitter/callback
   * @desc    Twitter OAuth callback
   * @access  Public
   */
  router.get(
    '/twitter/callback',
    passport.authenticate('twitter', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=twitter_auth_failed`
    }),
    authController.oauthCallback
  );
}

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/me',
  authenticate,
  generalRateLimiter,
  validateUpdateProfile,
  authController.updateProfile
);

/**
 * @route   POST /api/auth/upload-profile-image
 * @desc    Upload profile image
 * @access  Private
 */
router.post(
  '/upload-profile-image',
  authenticate,
  generalRateLimiter,
  uploadProfileImage,
  handleUploadError,
  authController.uploadProfileImage
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (invalidate all refresh tokens)
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  strictAuthRateLimiter,
  authController.logoutAll
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  strictAuthRateLimiter,
  validateChangePassword,
  authController.changePassword
);

/**
 * @route   POST /api/auth/link-provider
 * @desc    Link social provider to existing account
 * @access  Private
 */
router.post(
  '/link-provider',
  authenticate,
  generalRateLimiter,
  validateLinkProvider,
  authController.linkProvider
);

/**
 * @route   DELETE /api/auth/unlink-provider/:provider
 * @desc    Unlink social provider from account
 * @access  Private
 */
router.delete(
  '/unlink-provider/:provider',
  authenticate,
  generalRateLimiter,
  authController.unlinkProvider
);

/**
 * @route   DELETE /api/auth/me
 * @desc    Delete user account permanently
 * @access  Private
 */
router.delete(
  '/me',
  authenticate,
  strictAuthRateLimiter,
  authController.deleteAccount
);

export default router;
