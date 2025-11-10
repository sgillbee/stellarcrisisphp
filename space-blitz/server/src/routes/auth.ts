import express from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const router = express.Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, pass } = req.body;

    if (!name || !pass) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Empire name and password are required'
      });
    }

    // Find user by name
    const user = await User.findOne({ name: name.trim() });

    if (!user) {
      // Check if this is a new user creation attempt
      return res.json({
        action: 'createEmpire',
        message: 'Empire not found. Would you like to create a new empire?'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Incorrect password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        icon: user.icon,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Create new empire
router.post('/create-empire', async (req: Request, res: Response) => {
  try {
    const { name, pass, email } = req.body;

    if (!name || !pass) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Empire name and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Empire exists',
        message: 'An empire with this name already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Create new user
    const user = new User({
      name: name.trim(),
      password: hashedPassword,
      email: email || '',
      icon: 'alien1.gif', // Default icon
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        icon: user.icon,
        isAdmin: user.isAdmin
      },
      message: 'Empire created successfully'
    });

  } catch (error) {
    console.error('Create empire error:', error);
    return res.status(500).json({
      error: 'Creation failed',
      message: 'Failed to create empire'
    });
  }
});

// Logout (client-side token removal, but we can log the event)
router.post('/logout', async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // We could implement token blacklisting here if needed
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;