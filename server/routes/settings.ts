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
    const userId = req.user!.id;
    
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
    const userId = req.user!.id;
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

// Get banking preferences
router.get('/banking', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    let bankingSettings = await prisma.bankingSettings.findUnique({
      where: { userId }
    });

    // Create default settings if they don't exist
    if (!bankingSettings) {
      bankingSettings = await prisma.bankingSettings.create({
        data: { userId }
      });
    }

    // Get payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    });

    // Get transfer limits (mock data for now)
    const transferLimits = [
      { type: 'DAILY', amount: 5000, remaining: 3500 },
      { type: 'WEEKLY', amount: 25000, remaining: 18750 },
      { type: 'MONTHLY', amount: 100000, remaining: 75000 }
    ];

    res.json({ 
      settings: bankingSettings,
      paymentMethods,
      transferLimits
    });
  } catch (error) {
    console.error('Get banking settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update banking preferences
router.put('/banking', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const settings = req.body;

    const updatedSettings = await prisma.bankingSettings.upsert({
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
        description: 'Banking preferences updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update banking settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add payment method
router.post('/banking/payment-methods', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { type, name, last4, expiryMonth, expiryYear, provider } = req.body;

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        type,
        name,
        last4,
        expiryMonth,
        expiryYear,
        provider,
        isDefault: false,
        isVerified: false
      }
    });

    // Log payment method addition
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'PAYMENT_METHOD_ADDED',
        description: `New ${type.toLowerCase()} payment method added`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'MEDIUM'
      }
    });

    res.json({ paymentMethod });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set default payment method
router.put('/banking/payment-methods/:id/default', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Remove default from all other payment methods
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    // Set new default
    await prisma.paymentMethod.update({
      where: { 
        id,
        userId // Ensure user owns the payment method
      },
      data: { isDefault: true }
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete payment method
router.delete('/banking/payment-methods/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.paymentMethod.delete({
      where: { 
        id,
        userId // Ensure user owns the payment method
      }
    });

    // Log payment method deletion
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'PAYMENT_METHOD_REMOVED',
        description: 'Payment method removed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'MEDIUM'
      }
    });

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send email verification
router.post('/profile/verify-email', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, this would send an actual email
    // For now, just log the event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'EMAIL_VERIFICATION_SENT',
        description: 'Email verification sent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW'
      }
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send phone verification
router.post('/profile/verify-phone', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, this would send an actual SMS
    // For now, just log the event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'PHONE_VERIFICATION_SENT',
        description: 'Phone verification SMS sent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW'
      }
    });

    res.json({ message: 'Verification SMS sent' });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get privacy settings
router.get('/privacy', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For now, return default privacy settings
    // In a real app, you'd have a PrivacySettings model
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      marketingDataSharing: false,
      analyticsTracking: true,
      personalizationData: true,
      thirdPartySharing: false,
      dataRetentionPeriod: 36,
      allowCookies: true,
      functionalCookies: true,
      analyticsCookies: false,
      marketingCookies: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update privacy settings
router.patch('/privacy', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Log privacy settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Privacy settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    // In a real app, you'd update the PrivacySettings model
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, reason, feedback } = req.body;

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

    // Log account deletion
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        description: 'Account deletion requested',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'HIGH',
        metadata: {
          reason,
          feedback
        }
      }
    });

    // In a real app, you'd implement account deletion logic
    // For demo purposes, just mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    res.json({ message: 'Account deletion requested successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get support settings
router.get('/support/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Return default support settings
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      preferredContactMethod: 'EMAIL',
      defaultIssueCategory: 'general',
      allowMarketing: true,
      timezone: 'America/New_York',
      language: 'en',
      availabilityHours: 'business',
      prioritySupport: req.user.role === 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get support settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update support settings
router.patch('/support/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Log support settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Support settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update support settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get support tickets
router.get('/support/tickets', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Return mock support tickets
    const mockTickets = [
      {
        id: crypto.randomUUID(),
        userId,
        subject: 'Unable to transfer funds',
        category: 'transactions',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        description: 'I am having trouble transferring money to my savings account.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 3
      },
      {
        id: crypto.randomUUID(),
        userId,
        subject: 'Security question about recent login',
        category: 'security',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        description: 'I noticed a login from a new device and want to verify it was legitimate.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 2
      }
    ];

    res.json({ tickets: mockTickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statement settings
router.get('/statements/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Return default statement settings
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      preferredFormat: 'PDF',
      autoSubscription: true,
      deliveryMethod: 'EMAIL',
      statementFrequency: 'MONTHLY',
      includeImages: false,
      includeDetails: true,
      paperlessConsent: true,
      deliveryDay: 1,
      language: 'en',
      timezone: 'America/New_York',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get statement settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update statement settings
router.patch('/statements/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    // Log statement settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Statement settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update statement settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;