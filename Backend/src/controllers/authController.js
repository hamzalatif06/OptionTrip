import authService from '../services/authService.js';
import { asyncHandler } from '../middleware/security.js';
import { setCookieOptions } from '../middleware/security.js';
import { ACHIEVEMENTS, getUserStats, computeTravelLevel } from '../services/achievementService.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    const result = await authService.register({
      name,
      email,
      password,
      phoneNumber
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email }
    });
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await authService.verifyOtp(email, otp.toString().trim());

    res.cookie('refreshToken', result.tokens.refreshToken, setCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Email verified successfully. Welcome aboard!',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  });

  resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.resendOtp(email);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

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

  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(req.user._id, refreshToken);
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user._id);

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const tokens = await authService.refreshToken(req.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, setCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken
      }
    });
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  });

  uploadProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

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

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  });

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

  unlinkProvider = asyncHandler(async (req, res) => {
    const { provider } = req.params;

    const user = await authService.unlinkProvider(req.user._id, provider);

    res.status(200).json({
      success: true,
      message: `${provider} account unlinked successfully`,
      data: { user }
    });
  });

  deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    await authService.deleteAccount(req.user._id, password);

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  });

  updatePreferences = asyncHandler(async (req, res) => {
    const { travelStyle, preferredActivities, seatClass, hotelStars, dietaryRestrictions, accessibility } = req.body;
    const user = req.user;

    const update = {};
    if (travelStyle !== undefined)           update['preferences.travelStyle']           = travelStyle || null;
    if (preferredActivities !== undefined)   update['preferences.preferredActivities']   = Array.isArray(preferredActivities) ? preferredActivities : [];
    if (seatClass !== undefined)             update['preferences.seatClass']             = seatClass || null;
    if (hotelStars !== undefined)            update['preferences.hotelStars']            = hotelStars || null;
    if (dietaryRestrictions !== undefined)   update['preferences.dietaryRestrictions']   = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    if (accessibility !== undefined)         update['preferences.accessibility']         = Array.isArray(accessibility) ? accessibility : [];

    const updated = await user.constructor.findByIdAndUpdate(
      user._id,
      { $set: update },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences saved',
      data: { preferences: updated.preferences }
    });
  });

  updateSettings = asyncHandler(async (req, res) => {
    const { notificationPreferences, mapPrivacy, newsletterSubscribed, shippingAddress } = req.body;
    const user = req.user;

    const update = {};
    if (notificationPreferences !== undefined) {
      for (const key of ['tripReminders', 'bookingConfirmations', 'aiRecommendations', 'tripStoryActivity']) {
        if (typeof notificationPreferences[key] === 'boolean') {
          update[`notificationPreferences.${key}`] = notificationPreferences[key];
        }
      }
    }
    if (mapPrivacy !== undefined && ['private', 'countries_only', 'full_map', 'selected_trips'].includes(mapPrivacy)) {
      update.mapPrivacy = mapPrivacy;
    }
    if (typeof newsletterSubscribed === 'boolean') {
      update.newsletterSubscribed = newsletterSubscribed;
    }
    if (shippingAddress !== undefined) {
      for (const key of ['line1', 'line2', 'city', 'state', 'postalCode', 'country']) {
        if (typeof shippingAddress[key] === 'string') {
          update[`shippingAddress.${key}`] = shippingAddress[key].trim();
        }
      }
    }

    const updated = await user.constructor.findByIdAndUpdate(
      user._id,
      { $set: update },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Settings saved',
      data: {
        notificationPreferences: updated.notificationPreferences,
        mapPrivacy: updated.mapPrivacy,
        newsletterSubscribed: updated.newsletterSubscribed,
        shippingAddress: updated.shippingAddress
      }
    });
  });

  getAchievements = asyncHandler(async (req, res) => {
    const user = req.user;
    const stats = await getUserStats(user._id);
    const level = computeTravelLevel(stats);
    const unlockedIds = new Set((user.achievements || []).map(a => a.id));

    const achievements = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      label: a.label,
      icon: a.icon,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: (user.achievements || []).find(u => u.id === a.id)?.unlockedAt || null
    }));

    res.status(200).json({ success: true, data: { achievements, level, stats } });
  });

  oauthCallback = asyncHandler(async (req, res) => {
    const tokens = await authService.generateTokenPair(req.user);

    res.cookie('refreshToken', tokens.refreshToken, setCookieOptions());

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/?token=${tokens.accessToken}`;

    res.redirect(redirectUrl);
  });
}

export default new AuthController();
