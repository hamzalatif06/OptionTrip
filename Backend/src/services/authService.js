import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OtpVerification from '../models/OtpVerification.js';
import tokenService from './tokenService.js';
import { sendOtpEmail } from './emailService.js';

class AuthService {
  /**
   * Send OTP to email for registration verification
   * @param {Object} userData - { name, email, password, phoneNumber }
   * @returns {Object} { email, message }
   */
  async register(userData) {
    const { name, email, password, phoneNumber } = userData;

    // Check if a verified user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate 6-digit OTP — use 6 bcrypt rounds (OTP is short-lived, speed matters)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 6);

    // Upsert OTP record
    await OtpVerification.findOneAndDelete({ email });
    await OtpVerification.create({
      email,
      otpHash,
      userData: { name, password, phoneNumber }
    });

    // Fire email in background — don't block the HTTP response
    sendOtpEmail(email, name, otp).catch(err =>
      console.error('OTP email send failed:', err)
    );

    return { email, message: 'OTP sent to your email address' };
  }

  /**
   * Verify OTP and complete registration
   * @param {string} email
   * @param {string} otp
   * @returns {Object} { user, tokens }
   */
  async verifyOtp(email, otp) {
    const record = await OtpVerification.findOne({ email });

    if (!record) {
      throw new Error('OTP expired or not found. Please sign up again.');
    }

    if (record.attempts >= 5) {
      await OtpVerification.findOneAndDelete({ email });
      throw new Error('Too many failed attempts. Please sign up again.');
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      throw new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }

    // OTP valid — create the user
    const { name, password, phoneNumber } = record.userData;

    const user = new User({
      name,
      email,
      passwordHash: password,
      phoneNumber,
      authProviders: ['local'],
      emailVerified: true
    });

    await user.save();

    // Clean up OTP record
    await OtpVerification.findOneAndDelete({ email });

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user);

    return { user: user.toJSON(), tokens };
  }

  /**
   * Resend OTP for a pending registration
   * @param {string} email
   * @returns {Object} { message }
   */
  async resendOtp(email) {
    const record = await OtpVerification.findOne({ email });
    if (!record) {
      throw new Error('No pending registration found for this email. Please sign up again.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 6);

    record.otpHash = otpHash;
    record.attempts = 0;
    record.createdAt = new Date();
    await record.save();

    sendOtpEmail(email, record.userData.name, otp).catch(err =>
      console.error('Resend OTP email failed:', err)
    );

    return { message: 'New OTP sent to your email address' };
  }

  /**
   * Login user with email and password
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} { user, tokens }
   */
  async login(email, password) {
    // Find user and include password field
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has local auth provider
    if (!user.hasProvider('local')) {
      throw new Error('Please login using your social account');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await tokenService.generateTokenPair(user);

    // Remove password from response
    const userObject = user.toJSON();

    return {
      user: userObject,
      tokens
    };
  }

  /**
   * Logout user by revoking refresh token
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token to revoke
   */
  async logout(userId, refreshToken) {
    await tokenService.revokeRefreshToken(userId, refreshToken);
  }

  /**
   * Logout from all devices
   * @param {String} userId - User ID
   */
  async logoutAll(userId) {
    await tokenService.revokeAllRefreshTokens(userId);
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} { accessToken, refreshToken }
   */
  async refreshToken(refreshToken) {
    return await tokenService.refreshAccessToken(refreshToken);
  }

  /**
   * Get user profile
   * @param {String} userId - User ID
   * @returns {Object} User object
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user object
   */
  async updateProfile(userId, updateData) {
    const allowedUpdates = ['name', 'phoneNumber', 'profileImage'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasProvider('local')) {
      throw new Error('Cannot change password for social login accounts');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Set new password
    user.passwordHash = newPassword;
    await user.save();

    // Revoke all refresh tokens for security
    await tokenService.revokeAllRefreshTokens(userId);
  }

  /**
   * Link social provider to existing account
   * @param {String} userId - User ID
   * @param {String} provider - Provider name (google, facebook, twitter)
   * @param {String} providerId - Provider's user ID
   * @returns {Object} Updated user
   */
  async linkProvider(userId, provider, providerId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if provider is already linked
    if (user.hasProvider(provider)) {
      throw new Error(`${provider} account is already linked`);
    }

    // Check if provider ID is already used by another account
    const existingUser = await User.findByProvider(provider, providerId);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    // Link provider
    user[`${provider}Id`] = providerId;
    user.addAuthProvider(provider);
    await user.save();

    return user.toJSON();
  }

  /**
   * Unlink social provider from account
   * @param {String} userId - User ID
   * @param {String} provider - Provider name
   * @returns {Object} Updated user
   */
  async unlinkProvider(userId, provider) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    // Cannot unlink if it's the only auth method
    if (user.authProviders.length === 1) {
      throw new Error('Cannot unlink the only authentication method. Please add another method first.');
    }

    // Remove provider
    user[`${provider}Id`] = undefined;
    user.authProviders = user.authProviders.filter(p => p !== provider);
    await user.save();

    return user.toJSON();
  }

  /**
   * Delete user account
   * @param {String} userId - User ID
   * @param {String} password - User password (if local auth)
   */
  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    // If user has local auth, verify password
    if (user.hasProvider('local')) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
    }

    // Soft delete by deactivating account
    user.isActive = false;
    await user.save();

    // Revoke all tokens
    await tokenService.revokeAllRefreshTokens(userId);

    // For hard delete, use: await User.findByIdAndDelete(userId);
  }

  /**
   * Generate token pair for OAuth callback
   * @param {Object} user - User object
   * @returns {Object} { accessToken, refreshToken }
   */
  async generateTokenPair(user) {
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    return await tokenService.generateTokenPair(user);
  }
}

export default new AuthService();
