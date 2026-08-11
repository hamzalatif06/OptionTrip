import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OtpVerification from '../models/OtpVerification.js';
import tokenService from './tokenService.js';
import { sendOtpEmail } from './emailService.js';

class AuthService {
  async register(userData) {
    const { name, email, password, phoneNumber } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 6);

    await OtpVerification.findOneAndDelete({ email });
    await OtpVerification.create({
      email,
      otpHash,
      userData: { name, password, phoneNumber }
    });

    sendOtpEmail(email, name, otp).catch(err =>
      console.error('OTP email send failed:', err)
    );

    return { email, message: 'OTP sent to your email address' };
  }

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

    await OtpVerification.findOneAndDelete({ email });

    const tokens = await tokenService.generateTokenPair(user);

    return { user: user.toJSON(), tokens };
  }

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

  async login(email, password) {
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.hasProvider('local')) {
      throw new Error('Please login using your social account');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = await tokenService.generateTokenPair(user);

    const userObject = user.toJSON();

    return {
      user: userObject,
      tokens
    };
  }

  async logout(userId, refreshToken) {
    await tokenService.revokeRefreshToken(userId, refreshToken);
  }

  async logoutAll(userId) {
    await tokenService.revokeAllRefreshTokens(userId);
  }

  async refreshToken(refreshToken) {
    return await tokenService.refreshAccessToken(refreshToken);
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }

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

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasProvider('local')) {
      throw new Error('Cannot change password for social login accounts');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = newPassword;
    await user.save();

    await tokenService.revokeAllRefreshTokens(userId);
  }

  async linkProvider(userId, provider, providerId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.hasProvider(provider)) {
      throw new Error(`${provider} account is already linked`);
    }

    const existingUser = await User.findByProvider(provider, providerId);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    user[`${provider}Id`] = providerId;
    user.addAuthProvider(provider);
    await user.save();

    return user.toJSON();
  }

  async unlinkProvider(userId, provider) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.authProviders.length === 1) {
      throw new Error('Cannot unlink the only authentication method. Please add another method first.');
    }

    user[`${provider}Id`] = undefined;
    user.authProviders = user.authProviders.filter(p => p !== provider);
    await user.save();

    return user.toJSON();
  }

  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.hasProvider('local')) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
    }

    user.isActive = false;
    await user.save();

    await tokenService.revokeAllRefreshTokens(userId);
  }

  async generateTokenPair(user) {
    user.lastLogin = new Date();
    await user.save();

    return await tokenService.generateTokenPair(user);
  }
}

export default new AuthService();
