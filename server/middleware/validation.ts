import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param } from 'express-validator';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

// Rate limiting for KYC submissions (prevent spam)
export const kycSubmissionRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Maximum 3 KYC submissions per day per IP
  message: {
    success: false,
    message: 'Too many KYC submission attempts. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.role === 'ADMIN';
  }
});

// Enhanced validation middleware
export const validateKycSubmission = [
  // Full name validation
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\'\.]+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .custom((value) => {
      // Prevent suspicious patterns
      if (value.includes('test') || value.includes('Test') || value.includes('TEST')) {
        throw new Error('Invalid name format');
      }
      return true;
    }),

  // Date of birth validation
  body('dateOfBirth')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Date of birth must be in YYYY-MM-DD format')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 18) {
        throw new Error('Must be at least 18 years old');
      }
      if (age > 120) {
        throw new Error('Invalid date of birth');
      }
      
      return true;
    }),

  // Country validation (ISO 3166-1 alpha-2 codes)
  body('countryOfResidence')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase()
    .custom((value) => {
      // List of valid ISO 3166-1 alpha-2 country codes (subset for production)
      const validCountries = [
        'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
        'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
        'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
        'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
        'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
        'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
        'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
        'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
        'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
        'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
        'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
        'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
        'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
        'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
        'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
        'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
        'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
        'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
        'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
        'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
        'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
      ];
      
      if (!validCountries.includes(value)) {
        throw new Error('Invalid country code');
      }
      return true;
    }),

  // Address validation
  body('residentialAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Residential address must be between 10 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-\,\.#\/]+$/)
    .withMessage('Address contains invalid characters'),

  // Document types validation
  body('documentTypes')
    .isArray({ min: 1, max: 3 })
    .withMessage('Must provide 1-3 document types')
    .custom((types: string[]) => {
      const validTypes = ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'STATE_ID'];
      const invalidTypes = types.filter(type => !validTypes.includes(type));
      
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid document types: ${invalidTypes.join(', ')}`);
      }
      
      // Ensure no duplicates
      if (new Set(types).size !== types.length) {
        throw new Error('Duplicate document types not allowed');
      }
      
      return true;
    }),

  // IP address and device fingerprint (optional but validated if present)
  body('deviceFingerprint')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Device fingerprint too long'),
];

// Admin KYC review validation
export const validateKycReview = [
  param('requestId')
    .isUUID()
    .withMessage('Invalid request ID format'),

  body('status')
    .isIn(['APPROVED', 'REJECTED', 'REQUIRES_ADDITIONAL_INFO'])
    .withMessage('Invalid status. Must be APPROVED, REJECTED, or REQUIRES_ADDITIONAL_INFO'),

  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Rejection reason too long')
    .custom((value, { req }) => {
      if (req.body.status === 'REJECTED' && !value) {
        throw new Error('Rejection reason is required when rejecting');
      }
      return true;
    }),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Admin notes too long'),

  body('riskScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Risk score must be between 0 and 100'),

  body('complianceFlags')
    .optional()
    .isObject()
    .withMessage('Compliance flags must be an object'),
];

// Generic validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  
  next();
};

// Sanitization middleware
export const sanitizeKycData = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.fullName) {
      req.body.fullName = validator.escape(req.body.fullName.trim());
    }
    
    if (req.body.residentialAddress) {
      req.body.residentialAddress = validator.escape(req.body.residentialAddress.trim());
    }
    
    if (req.body.adminNotes) {
      req.body.adminNotes = validator.escape(req.body.adminNotes.trim());
    }
    
    if (req.body.rejectionReason) {
      req.body.rejectionReason = validator.escape(req.body.rejectionReason.trim());
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Data sanitization failed'
    });
  }
};

// Check for suspicious patterns (honeypot/bot detection)
export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /test.*test/i,
    /example.*example/i,
    /fake.*fake/i,
    /\d{10,}/, // Too many consecutive digits
    /(.)\1{10,}/, // Repeated characters
  ];
  
  const dataToCheck = [
    req.body.fullName,
    req.body.residentialAddress
  ].filter(Boolean);
  
  for (const data of dataToCheck) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(data)) {
        // Log suspicious activity
        console.warn(`Suspicious KYC submission detected:`, {
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          pattern: pattern.source,
          data: data.substring(0, 50) + '...'
        });
        
        return res.status(400).json({
          success: false,
          message: 'Submission contains invalid information'
        });
      }
    }
  }
  
  next();
};

// IP geolocation validation (optional enhanced security)
export const validateGeolocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip for development/admin users
    if (process.env.NODE_ENV !== 'production' || req.user?.role === 'ADMIN') {
      return next();
    }
    
    const userIp = req.ip || req.connection.remoteAddress;
    const countryCode = req.body.countryOfResidence;
    
    // In production, integrate with IP geolocation service
    // For now, just validate the presence of required data
    if (!userIp || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify location information'
      });
    }
    
    // Log for audit trail
    console.log(`KYC submission geo-validation:`, {
      userId: req.user?.id,
      ip: userIp,
      declaredCountry: countryCode,
      timestamp: new Date().toISOString()
    });
    
    next();
  } catch (error) {
    console.error('Geolocation validation error:', error);
    next(); // Continue without blocking on geolocation errors
  }
};

export default {
  kycSubmissionRateLimit,
  validateKycSubmission,
  validateKycReview,
  handleValidationErrors,
  sanitizeKycData,
  detectSuspiciousActivity,
  validateGeolocation
};