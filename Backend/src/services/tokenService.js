import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class TokenService {
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

  async generateTokenPair(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await this.storeRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  }

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

  async refreshAccessToken(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);

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

    const tokens = await this.generateTokenPair(user);

    await this.revokeRefreshToken(user._id, refreshToken);

    return tokens;
  }

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

  async revokeAllRefreshTokens(userId) {
    await User.findByIdAndUpdate(
      userId,
      {
        $set: { refreshTokens: [] }
      }
    );
  }

  async cleanExpiredTokens(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const validTokens = [];

    for (const tokenObj of user.refreshTokens) {
      try {
        this.verifyRefreshToken(tokenObj.token);
        validTokens.push(tokenObj);
      } catch (error) {}
    }

    user.refreshTokens = validTokens;
    await user.save();
  }
}

export default new TokenService();
