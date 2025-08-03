import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Get user documents
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalDocuments: documents.length,
      verifiedDocuments: documents.filter(d => d.verified).length,
      pendingVerification: documents.filter(d => !d.verified).length,
      storageUsed: documents.reduce((total, doc) => total + doc.size, 0),
      storageLimit: 100 * 1024 * 1024 // 100MB
    };

    res.json({ documents, summary });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload document
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Validate document type
    const validTypes = ['DRIVERS_LICENSE', 'PASSPORT', 'UTILITY_BILL', 'BANK_STATEMENT', 'TAX_DOCUMENT', 'IDENTITY_VERIFICATION'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId,
        type,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/documents/${file.filename}`,
        verified: false
      }
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'DOCUMENT_UPLOADED',
        description: `Document uploaded: ${type}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW',
        metadata: {
          documentId: document.id,
          filename: file.originalname,
          size: file.size
        }
      }
    });

    res.json({ document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific document
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { 
        id,
        userId // Ensure user owns the document
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { 
        id,
        userId // Ensure user owns the document
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads/documents', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'DOCUMENT_DELETED',
        description: `Document deleted: ${document.type}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'MEDIUM',
        metadata: {
          documentId: document.id,
          filename: document.originalName
        }
      }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to verify document
router.put('/:id/verify', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { verified } = req.body;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? userId : null
      }
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId: document.userId,
        eventType: verified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
        description: `Document ${verified ? 'verified' : 'rejected'}: ${document.type}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW',
        metadata: {
          documentId: document.id,
          verifiedBy: userId
        }
      }
    });

    res.json({ document });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;