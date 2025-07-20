import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { prisma, redis } from '../server';
import { config } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export const signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpire }
    );

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      30 * 24 * 60 * 60 // 30 days
    );

    return res.status(201).json({
      message: 'User created successfully',
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpire }
    );

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      30 * 24 * 60 * 60
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };

    // Check if token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpire }
    );

    // Update refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      newRefreshToken,
      'EX',
      30 * 24 * 60 * 60
    );

    return res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      
      // Remove refresh token from Redis
      await redis.del(`refresh_token:${decoded.userId}`);

      // Remove session
      await prisma.session.deleteMany({
        where: { 
          userId: decoded.userId,
          token: refreshToken
        }
      });
    } catch (error) {
      // Token might be invalid, but we still return success
      console.error('Token verification failed during logout:', error);
    }

    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};