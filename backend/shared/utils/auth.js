const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class AuthUtils {
  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, tokenId: uuidv4() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  }

  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  static generateResetToken() {
    return uuidv4();
  }

  static generateVerificationToken() {
    return uuidv4();
  }

  static checkPermissions(user, resource, action) {
    // Role-based access control
    const permissions = {
      ADMIN: ['read', 'write', 'delete', 'manage'],
      ENTERPRISE: ['read', 'write', 'delete', 'share'],
      TRANSLATOR: ['read', 'write', 'comment'],
      READER: ['read', 'comment']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(action);
  }

  static hasRole(user, requiredRole) {
    const roleHierarchy = {
      ADMIN: 4,
      ENTERPRISE: 3,
      TRANSLATOR: 2,
      READER: 1
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static sanitizeUser(user) {
    // Remove sensitive fields from user object
    const { password_hash, verification_token, reset_password_token, ...sanitized } = user;
    return sanitized;
  }

  static createAuthResponse(user, tokens) {
    return {
      user: this.sanitizeUser(user),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  static generateSessionId() {
    return uuidv4();
  }

  static createWebSocketAuthPayload(user, documentId) {
    return {
      userId: user.id,
      userRole: user.role,
      documentId: documentId,
      timestamp: Date.now()
    };
  }

  static validateWebSocketAuth(connectionParams) {
    if (!connectionParams || !connectionParams.authorization) {
      throw new Error('No authorization token provided');
    }

    const token = this.extractTokenFromHeader(connectionParams.authorization);
    if (!token) {
      throw new Error('Invalid authorization format');
    }

    return this.verifyAccessToken(token);
  }

  static createPasswordResetPayload(user, token) {
    return {
      userId: user.id,
      email: user.email,
      token: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
  }

  static createEmailVerificationPayload(user, token) {
    return {
      userId: user.id,
      email: user.email,
      token: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  static rateLimitKey(ip, userId = null) {
    return userId ? `ratelimit:user:${userId}` : `ratelimit:ip:${ip}`;
  }

  static loginAttemptKey(email) {
    return `login_attempts:${email}`;
  }

  static sessionKey(sessionId) {
    return `session:${sessionId}`;
  }

  static blacklistKey(tokenId) {
    return `blacklist:${tokenId}`;
  }
}

module.exports = AuthUtils;
