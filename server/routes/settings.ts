import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

const router = Router();

// Get user settings
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        profileImage: true,
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      dateOfBirth
    } = req.body;

    // Log security event for profile update
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Profile information updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(req.body)
        }
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        dateOfBirth: true,
        profileImage: true,
        kycStatus: true,
        emailVerified: true,
        phoneVerified: true,
        updatedAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get security settings
router.get('/security', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let securitySettings = await prisma.securitySettings.findUnique({
      where: { userId }
    });

    // Create default settings if they don't exist
    if (!securitySettings) {
      securitySettings = await prisma.securitySettings.create({
        data: { userId }
      });
    }

    // Get active sessions
    const activeSessions = await prisma.loginSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        lastUsed: 'desc'
      }
    });

    // Get recent security events
    const securityEvents = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Remove sensitive data
    const safeSettings = {
      ...securitySettings,
      twoFactorSecret: undefined,
      backupCodes: undefined
    };

    res.json({
      settings: safeSettings,
      activeSessions,
      securityEvents
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/security/password', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      // Log failed password change attempt
      await prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'SUSPICIOUS_ACTIVITY',
          description: 'Failed password change attempt - incorrect current password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          riskLevel: 'MEDIUM'
        }
      });
      
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and security settings
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      }),
      prisma.securitySettings.upsert({
        where: { userId },
        update: {
          passwordLastChanged: new Date()
        },
        create: {
          userId,
          passwordLastChanged: new Date()
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'PASSWORD_CHANGED',
          description: 'Password successfully changed',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          riskLevel: 'LOW'
        }
      })
    ]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup Two-Factor Authentication
router.post('/security/2fa/setup', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Prime Edge Banking (${req.user.email})`,
      issuer: 'Prime Edge Banking',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store temporary secret (will be confirmed in next step)
    await prisma.securitySettings.upsert({
      where: { userId },
      update: {
        twoFactorSecret: secret.base32, // Store temporarily
        twoFactorEnabled: false // Not enabled until verified
      },
      create: {
        userId,
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false
      }
    });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify and enable Two-Factor Authentication
router.post('/security/2fa/verify', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const securitySettings = await prisma.securitySettings.findUnique({
      where: { userId }
    });

    if (!securitySettings?.twoFactorSecret) {
      return res.status(400).json({ error: 'No 2FA setup in progress' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: securitySettings.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Enable 2FA
    await prisma.$transaction([
      prisma.securitySettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: true,
          twoFactorType: 'AUTHENTICATOR',
          backupCodes
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'TWO_FACTOR_ENABLED',
          description: 'Two-factor authentication enabled',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          riskLevel: 'LOW'
        }
      })
    ]);

    res.json({
      message: '2FA enabled successfully',
      backupCodes
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable Two-Factor Authentication
router.post('/security/2fa/disable', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Disable 2FA
    await prisma.$transaction([
      prisma.securitySettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: false,
          twoFactorType: null,
          twoFactorSecret: null,
          backupCodes: []
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'TWO_FACTOR_DISABLED',
          description: 'Two-factor authentication disabled',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          riskLevel: 'MEDIUM'
        }
      })
    ]);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification settings
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    // Create default settings if they don't exist
    if (!notificationSettings) {
      notificationSettings = await prisma.notificationSettings.create({
        data: { userId }
      });
    }

    res.json({ settings: notificationSettings });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification settings
router.put('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    // Log settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Notification settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // Create default settings if they don't exist
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: { userId }
      });
    }

    res.json({ settings: userSettings });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    // Log settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'User preferences updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Terminate login session
router.delete('/security/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    await prisma.loginSession.update({
      where: {
        id: sessionId,
        userId // Ensure user can only terminate their own sessions
      },
      data: {
        isActive: false
      }
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'DEVICE_REMOVED',
        description: `Login session terminated: ${sessionId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW'
      }
    });

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export security data
router.get('/privacy/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: true,
        userSettings: true,
        securitySettings: {
          select: {
            twoFactorEnabled: true,
            twoFactorType: true,
            passwordLastChanged: true,
            sessionTimeout: true,
            deviceTrustEnabled: true,
            loginAlertsEnabled: true,
            lastSecurityCheck: true,
            createdAt: true,
            updatedAt: true
          }
        },
        notificationSettings: true,
        loginSessions: true,
        securityEvents: true,
        documents: {
          select: {
            type: true,
            filename: true,
            uploadedAt: true,
            verified: true,
            verifiedAt: true
          }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const exportData = {
      ...userData,
      password: undefined,
      id: undefined
    };

    // Log data export
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'DATA_EXPORT',
        description: 'User data exported',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'MEDIUM'
      }
    });

    res.json({
      exportDate: new Date().toISOString(),
      userData: exportData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;