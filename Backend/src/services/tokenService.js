import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class TokenService {
  /**
   * Generate access token (short-lived)
   * @param {Object} payload - User data to encode
   * @returns {String} JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        issuer: 'optiontrip-api'
      }
    );
  }

  /**
   * Generate refresh token (long-lived)
   * @param {Object} payload - User data to encode
   * @returns {String} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
        issuer: 'optiontrip-api'
      }
    );
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User document
   * @returns {Object} { accessToken, refreshToken }
   */
  async generateTokenPair(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    await this.storeRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in user document
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token to store
   */
  async storeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          refreshTokens: {
            token: refreshToken,
            createdAt: new Date()
          }
        }
      }
    );
  }

  /**
   * Verify access token
   * @param {String} token - Access token to verify
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   * @param {String} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} { accessToken, refreshToken }
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken
    );

    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = await this.generateTokenPair(user);

    // Remove old refresh token
    await this.revokeRefreshToken(user._id, refreshToken);

    return tokens;
  }

  /**
   * Revoke a specific refresh token
   * @param {String} userId - User ID
   * @param {String} refreshToken - Token to revoke
   */
  async revokeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          refreshTokens: { token: refreshToken }
        }
      }
    );
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   * @param {String} userId - User ID
   */
  async revokeAllRefreshTokens(userId) {
    await User.findByIdAndUpdate(
      userId,
      {
        $set: { refreshTokens: [] }
      }
    );
  }

  /**
   * Clean up expired refresh tokens
   * @param {String} userId - User ID
   */
  async cleanExpiredTokens(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const validTokens = [];

    for (const tokenObj of user.refreshTokens) {
      try {
        this.verifyRefreshToken(tokenObj.token);
        validTokens.push(tokenObj);
      } catch (error) {
        // Token is expired or invalid, skip it
      }
    }

    user.refreshTokens = validTokens;
    await user.save();
  }
}

export default new TokenService();
