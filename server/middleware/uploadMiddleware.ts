import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// GDPR-compliant file upload security configuration
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 4, // 3 documents + 1 selfie
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
  KYC_UPLOAD_DIR: path.join(process.cwd(), 'server', 'uploads', 'kyc'),
  TEMP_DIR: path.join(process.cwd(), 'server', 'uploads', 'temp')
};

// Ensure upload directories exist with proper permissions
const ensureUploadDirectories = () => {
  [UPLOAD_CONFIG.KYC_UPLOAD_DIR, UPLOAD_CONFIG.TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
    }
  });
};

// Initialize directories
ensureUploadDirectories();

// File filter with comprehensive security checks
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Validate MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`));
    }

    // Validate file extension (double-check against MIME spoofing)
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(fileExt)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`));
    }

    // Validate filename (prevent path traversal)
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\\\')) {
      return cb(new Error('Invalid filename detected'));
    }

    // Check filename length (prevent buffer overflow)
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('File validation failed'));
  }
};

// Secure filename generation with UUID and sanitization
const generateSecureFilename = (originalname: string): string => {
  const ext = path.extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const uuid = uuidv4();
  const hash = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}_${uuid}_${hash}${ext}`;
};

// Custom storage configuration with security measures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use temporary directory first for virus scanning (if implemented)
    cb(null, UPLOAD_CONFIG.TEMP_DIR);
  },
  filename: (req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file.originalname);
      cb(null, secureFilename);
    } catch (error) {
      cb(new Error('Failed to generate secure filename'));
    }
  }
});

// Main upload middleware configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: UPLOAD_CONFIG.MAX_FILES,
    fieldNameSize: 50,
    fieldSize: 1024,
    fields: 20
  }
});

// KYC-specific upload middleware
export const kycUpload = upload.fields([
  { name: 'documents', maxCount: 3 },
  { name: 'selfie', maxCount: 1 }
]);

// File security validation middleware (runs after multer)
export const validateUploadedFiles = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (!files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { documents = [], selfie = [] } = files;
    const allFiles = [...documents, ...selfie];

    // Validate minimum requirements
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one identity document is required'
      });
    }

    if (selfie.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selfie is required for identity verification'
      });
    }

    // Additional file content validation
    for (const file of allFiles) {
      // Check if file actually has content
      if (file.size === 0) {
        return res.status(400).json({
          success: false,
          message: `Empty file detected: ${file.originalname}`
        });
      }

      // Validate file signature/magic bytes for common formats
      const buffer = fs.readFileSync(file.path);
      if (!validateFileSignature(buffer, file.mimetype)) {
        // Clean up invalid file
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: `Invalid file format detected: ${file.originalname}`
        });
      }
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      message: 'File validation failed'
    });
  }
};

// File signature validation (magic bytes check)
const validateFileSignature = (buffer: Buffer, mimeType: string): boolean => {
  const signatures: { [key: string]: number[][] } = {
    'image/jpeg': [
      [0xFF, 0xD8, 0xFF],
    ],
    'image/jpg': [
      [0xFF, 0xD8, 0xFF],
    ],
    'image/png': [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ],
    'application/pdf': [
      [0x25, 0x50, 0x44, 0x46] // %PDF
    ]
  };

  const expectedSignatures = signatures[mimeType];
  if (!expectedSignatures) return false;

  return expectedSignatures.some(signature => {
    return signature.every((byte, index) => {
      return index < buffer.length && buffer[index] === byte;
    });
  });
};

// Move files from temp to final KYC directory
export const moveFilesToKycDirectory = (files: Express.Multer.File[]): string[] => {
  const finalPaths: string[] = [];

  for (const file of files) {
    const finalPath = path.join(UPLOAD_CONFIG.KYC_UPLOAD_DIR, file.filename);
    fs.renameSync(file.path, finalPath);
    finalPaths.push(file.filename); // Store relative path
  }

  return finalPaths;
};

// Clean up uploaded files (for error cases)
export const cleanupUploadedFiles = (files: Express.Multer.File[]) => {
  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file.path}:`, error);
    }
  });
};

// GDPR compliance: Secure file deletion
export const secureDeleteFile = (filePath: string): boolean => {
  try {
    const fullPath = path.join(UPLOAD_CONFIG.KYC_UPLOAD_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return true; // File already deleted
    }

    // Get file stats
    const stats = fs.statSync(fullPath);
    const fileSize = stats.size;

    // Overwrite file with random data multiple times (DoD 5220.22-M standard)
    const fd = fs.openSync(fullPath, 'r+');
    
    for (let pass = 0; pass < 3; pass++) {
      const randomBuffer = crypto.randomBytes(fileSize);
      fs.writeSync(fd, randomBuffer, 0, fileSize, 0);
      fs.fsyncSync(fd);
    }
    
    fs.closeSync(fd);
    fs.unlinkSync(fullPath);
    
    return true;
  } catch (error) {
    console.error(`Failed to securely delete file ${filePath}:`, error);
    return false;
  }
};

export default {
  kycUpload,
  validateUploadedFiles,
  moveFilesToKycDirectory,
  cleanupUploadedFiles,
  secureDeleteFile,
  UPLOAD_CONFIG
};