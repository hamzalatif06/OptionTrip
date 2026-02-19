import authService from '../services/authService.js';
import { asyncHandler } from '../middleware/security.js';
import { setCookieOptions } from '../middleware/security.js';

class AuthController {
  /**
   * Register new user
   * POST /api/auth/signup
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    const result = await authService.register({
      name,
      email,
      password,
      phoneNumber
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, setCookieOptions());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, setCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(req.user._id, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user._id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const tokens = await authService.refreshToken(req.refreshToken);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, setCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken
      }
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  /**
   * Update user profile
   * PUT /api/auth/me
   */
  updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  });

  /**
   * Upload profile image
   * POST /api/auth/upload-profile-image
   */
  uploadProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Generate the URL for the uploaded image
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    // Update user profile with the new image URL
    const user = await authService.updateProfile(req.user._id, {
      profileImage: imageUrl
    });

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        user,
        imageUrl
      }
    });
  });

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    // Clear refresh token cookie (user will need to login again)
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  });

  /**
   * Link social provider to account
   * POST /api/auth/link-provider
   */
  linkProvider = asyncHandler(async (req, res) => {
    const { provider, providerId } = req.body;

    const user = await authService.linkProvider(
      req.user._id,
      provider,
      providerId
    );

    res.status(200).json({
      success: true,
      message: `${provider} account linked successfully`,
      data: { user }
    });
  });

  /**
   * Unlink social provider from account
   * DELETE /api/auth/unlink-provider/:provider
   */
  unlinkProvider = asyncHandler(async (req, res) => {
    const { provider } = req.params;

    const user = await authService.unlinkProvider(req.user._id, provider);

    res.status(200).json({
      success: true,
      message: `${provider} account unlinked successfully`,
      data: { user }
    });
  });

  /**
   * Delete user account
   * DELETE /api/auth/me
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    await authService.deleteAccount(req.user._id, password);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  });

  /**
   * OAuth callback handler (universal for all providers)
   */
  oauthCallback = asyncHandler(async (req, res) => {
    // User is attached to req by Passport after successful OAuth
    const tokens = await authService.generateTokenPair(req.user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, setCookieOptions());

    // Redirect directly to home page with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/?token=${tokens.accessToken}`;

    res.redirect(redirectUrl);
  });
}

export default new AuthController();
