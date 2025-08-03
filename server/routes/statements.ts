import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

const router = Router();

// Get user statements
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's transactions for statement generation
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Generate mock statements based on transactions
    const statements = generateStatements(userId, transactions);

    // Calculate summary statistics
    const summary = {
      totalStatements: statements.length,
      availableStatements: statements.filter(s => s.status === 'AVAILABLE').length,
      totalDownloads: 0, // This would be tracked in a downloads table
      lastGenerated: statements.length > 0 ? statements[0].createdAt : new Date().toISOString()
    };

    res.json({ statements, summary });
  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate statement
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate } = req.body;

    // Validate input
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Type, start date, and end date are required' });
    }

    const validTypes = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'TAX'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid statement type' });
    }

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate statement (in a real app, this would create a PDF)
    const statement = {
      id: `stmt_${Date.now()}`,
      type,
      period: formatPeriod(type, new Date(startDate), new Date(endDate)),
      startDate,
      endDate,
      status: 'PROCESSING',
      size: Math.floor(Math.random() * 500000) + 100000, // Random size between 100KB and 600KB
      createdAt: new Date().toISOString(),
      transactionCount: transactions.length,
      totalDebit: transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0),
      totalCredit: transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0)
    };

    // In a real app, you would:
    // 1. Queue a background job to generate the PDF
    // 2. Store the statement request in the database
    // 3. Send an email notification when ready

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'STATEMENT_REQUESTED',
        description: `Statement requested: ${type} for ${statement.period}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW',
        metadata: {
          statementType: type,
          period: statement.period,
          transactionCount: transactions.length
        }
      }
    });

    res.json({ statement, message: 'Statement generation started. You will receive an email when ready.' });
  } catch (error) {
    console.error('Generate statement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download statement
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // In a real app, you would:
    // 1. Verify the statement belongs to the user
    // 2. Check if the statement is ready
    // 3. Serve the PDF file
    // 4. Log the download event

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'STATEMENT_DOWNLOADED',
        description: `Statement downloaded: ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW',
        metadata: {
          statementId: id
        }
      }
    });

    // For now, return a message
    res.json({ 
      message: 'Statement download would begin here',
      downloadUrl: `/api/statements/${id}/file`
    });
  } catch (error) {
    console.error('Download statement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request tax documents
router.post('/tax-documents/request', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, email } = req.body;

    if (!year) {
      return res.status(400).json({ error: 'Tax year is required' });
    }

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'TAX_DOCUMENTS_REQUESTED',
        description: `Tax documents requested for year ${year}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'LOW',
        metadata: {
          taxYear: year,
          emailRequested: !!email
        }
      }
    });

    res.json({ 
      message: `Tax documents for ${year} have been requested. ${email ? 'You will receive an email when ready.' : 'Check back here for updates.'}` 
    });
  } catch (error) {
    console.error('Request tax documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate mock statements
function generateStatements(userId: string, transactions: any[]) {
  const statements = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate monthly statements for the past 12 months
  for (let i = 0; i < 12; i++) {
    const statementDate = new Date(currentYear, currentMonth - i, 1);
    const endDate = new Date(currentYear, currentMonth - i + 1, 0);
    
    // Get transactions for this month
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= statementDate && transactionDate <= endDate;
    });

    if (monthTransactions.length > 0 || i < 3) { // Always include last 3 months even if no transactions
      statements.push({
        id: `stmt_monthly_${statementDate.getTime()}`,
        type: 'MONTHLY',
        period: `${statementDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        startDate: statementDate.toISOString(),
        endDate: endDate.toISOString(),
        status: i === 0 ? 'PROCESSING' : 'AVAILABLE',
        size: Math.floor(Math.random() * 300000) + 50000,
        downloadUrl: i === 0 ? undefined : `/api/statements/stmt_monthly_${statementDate.getTime()}/download`,
        createdAt: new Date(statementDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days after month end
      });
    }
  }

  // Generate quarterly statements for the past 2 years
  for (let year = currentYear; year >= currentYear - 1; year--) {
    for (let quarter = 4; quarter >= 1; quarter--) {
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 0);
      
      // Skip future quarters
      if (startDate > now) continue;

      const quarterTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      if (quarterTransactions.length > 0) {
        statements.push({
          id: `stmt_quarterly_${year}_Q${quarter}`,
          type: 'QUARTERLY',
          period: `Q${quarter} ${year}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'AVAILABLE',
          size: Math.floor(Math.random() * 500000) + 100000,
          downloadUrl: `/api/statements/stmt_quarterly_${year}_Q${quarter}/download`,
          createdAt: new Date(endDate.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString() // 14 days after quarter end
        });
      }
    }
  }

  // Generate annual statements for the past 3 years
  for (let year = currentYear - 1; year >= currentYear - 3; year--) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    if (yearTransactions.length > 0) {
      statements.push({
        id: `stmt_annual_${year}`,
        type: 'ANNUAL',
        period: `Annual ${year}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'AVAILABLE',
        size: Math.floor(Math.random() * 1000000) + 200000,
        downloadUrl: `/api/statements/stmt_annual_${year}/download`,
        createdAt: new Date(year + 1, 0, 31).toISOString() // January 31st of following year
      });
    }
  }

  return statements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Helper function to format period
function formatPeriod(type: string, startDate: Date, endDate: Date): string {
  switch (type) {
    case 'MONTHLY':
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'QUARTERLY':
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startDate.getFullYear()}`;
    case 'ANNUAL':
      return `Annual ${startDate.getFullYear()}`;
    case 'TAX':
      return `Tax Year ${startDate.getFullYear()}`;
    default:
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
}

export default router;