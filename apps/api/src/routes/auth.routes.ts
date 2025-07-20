import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Signup route
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3 }).trim(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim()
], authController.signup);

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

// Refresh token route
router.post('/refresh', authController.refreshToken);

// Logout route
router.post('/logout', authController.logout);

// Get current user route (protected)
router.get('/me', authController.getCurrentUser);

export default router;