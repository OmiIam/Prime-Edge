# Clean Transfer System

A production-ready external bank transfer system built from scratch with TypeScript, Express, Prisma, Socket.IO, and JWT authentication.

## 🚀 Features

- **External Bank Transfers**: Create pending transfers that require admin approval
- **Real-time Notifications**: Socket.IO with JWT authentication + polling fallback
- **Admin Approval Workflow**: Approve/reject transfers with audit trail
- **In-Process Queue**: Simulates async bank API calls (easily upgradeable to BullMQ/Redis)
- **Data Sanitization**: Bulletproof protection against circular references
- **Comprehensive Validation**: Input validation for amounts, currencies, recipient info
- **TypeScript**: Fully typed implementation with strict type checking

## 📁 Project Structure

```
server/
├── index.ts                          # Express + Socket.IO bootstrap
├── socket/socket.ts                  # Socket.IO service with JWT auth
├── middleware/auth.ts                # JWT authentication & admin guards
├── utils/
│   ├── responseHelpers.ts           # Standardized API responses
│   └── sanitizeTransactionData.ts   # Data sanitization utilities
├── services/transferService.ts      # Business logic & in-process queue
├── controllers/transferController.ts # HTTP controllers (user & admin)
├── routes/
│   ├── user-transfers.ts            # User endpoints
│   └── admin-transfers.ts           # Admin endpoints
└── tests/transfer.test.ts           # Jest test suite

client/hooks/useCleanTransfers.ts    # React hook with Socket.IO + polling

scripts/migrate-transfer-system.sql  # Database migration script
```

## 🛠 Installation

### 1. Install Dependencies

```bash
npm install express socket.io @prisma/client
npm install -D @types/express @types/node typescript tsx jest
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/transfers"
JWT_SECRET="your-super-secure-secret-key-min-32-characters"
PORT=5173

# Optional
MOCK_BANK_DELAY_MS=2000
SOCKET_IO_CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### 3. Database Migration

Run the migration script to add transfer support:

```bash
# Using psql
psql $DATABASE_URL -f scripts/migrate-transfer-system.sql

# Or using Prisma
npx prisma db push
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:5173 with Socket.IO ready for real-time updates.

## 📡 API Endpoints

All endpoints return JSON with format: `{ success: boolean, message: string, data?: any }`

### User Endpoints

#### Create Transfer
```http
POST /api/user/transfer
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "USD",
  "recipientInfo": {
    "name": "John Doe",
    "accountNumber": "1234567890",
    "bankCode": "ABC123"
  },
  "description": "Payment to supplier"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transfer submitted successfully and is awaiting approval",
  "data": {
    "transaction": {
      "id": "tx-uuid",
      "userId": "user-uuid",
      "type": "EXTERNAL_TRANSFER",
      "amount": 1000,
      "currency": "USD",
      "status": "PENDING",
      "description": "Payment to supplier",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  }
}
```

#### Get Transfer Updates
```http
GET /api/user/transfer-updates?limit=50&since=2023-12-01T09:00:00Z
Authorization: Bearer <jwt-token>
```

### Admin Endpoints

#### Get Pending Transfers
```http
GET /api/admin/pending-transfers?page=1&limit=20
Authorization: Bearer <admin-jwt-token>
```

#### Approve Transfer
```http
POST /api/admin/transfer/:id/approve
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "adminNotes": "Verified account details and approved"
}
```

#### Reject Transfer
```http
POST /api/admin/transfer/:id/reject
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "rejectionReason": "Invalid recipient account number"
}
```

## 🔌 Socket.IO Real-time Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('/', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket', 'polling']
});
```

### Events Received
- `transfer_pending` - Emitted when transfer is created
- `transfer_update` - Emitted when transfer is approved/rejected
- `system_notification` - System-wide announcements

### Event Format
```javascript
socket.on('transfer_pending', (response) => {
  // response = { success: true, message: "...", data: { transaction: {...} } }
});

socket.on('transfer_update', (response) => {
  // response = { success: true, message: "...", data: { transaction: {...} } }
});
```

## ⚛️ React Integration

Use the provided hook for seamless integration:

```tsx
import { useCleanTransfers } from './hooks/useCleanTransfers';

function TransferComponent() {
  const { 
    transfers, 
    isLoading, 
    error, 
    isConnected, 
    createTransfer 
  } = useCleanTransfers({
    enableSocketIO: true,
    pollingInterval: 30000,
    onTransferUpdate: (transfer) => {
      if (transfer.status === 'COMPLETED') {
        showNotification('Transfer completed!');
      }
    }
  });

  const handleSubmit = async (transferData) => {
    try {
      await createTransfer({
        amount: 1000,
        currency: 'USD',
        recipientInfo: {
          name: 'John Doe',
          accountNumber: '1234567890',
          bankCode: 'ABC123'
        }
      });
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <div>
      <div className={isConnected ? 'text-green-600' : 'text-yellow-600'}>
        {isConnected ? '🟢 Real-time' : '🟡 Polling fallback'}
      </div>
      
      {transfers.map(transfer => (
        <div key={transfer.id}>
          <span>{transfer.amount} {transfer.currency}</span>
          <span className={`status-${transfer.status.toLowerCase()}`}>
            {transfer.status}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Transfer-specific tests
npm test -- --testPathPattern=transfer

# With coverage
npm test -- --coverage
```

### Test Categories
- **Unit Tests**: Service methods, validation functions, sanitization
- **Integration Tests**: HTTP endpoints, database interactions
- **Socket Tests**: Real-time event emission (mocked)

### Example Test
```typescript
describe('TransferService', () => {
  it('should create transfer successfully', async () => {
    const result = await transferService.createTransfer('user-123', {
      amount: 500,
      currency: 'USD',
      recipientInfo: {
        name: 'John Doe',
        accountNumber: '1234567890',
        bankCode: 'ABC123'
      }
    });

    expect(result?.amount).toBe(500);
    expect(result?.status).toBe('PENDING');
  });
});
```

## 🏗️ Production Deployment

### 1. Replace In-Process Queue with BullMQ

Install BullMQ and Redis:
```bash
npm install bullmq ioredis
```

Update `transferService.ts`:
```typescript
import { Queue } from 'bullmq';

const transferQueue = new Queue('transfer-processing', {
  connection: { host: 'redis-host', port: 6379 }
});

// Replace processQueue.add() with:
await transferQueue.add('process-transfer', { transferId, adminId });
```

### 2. Replace Mock Bank Client

Update `transferService.ts`:
```typescript
import { BankAPIClient } from '@your-bank/sdk';

const bankClient = new BankAPIClient({
  apiUrl: process.env.BANK_API_URL,
  apiKey: process.env.BANK_API_KEY,
  apiSecret: process.env.BANK_API_SECRET
});
```

### 3. Environment Variables

Production `.env`:
```bash
NODE_ENV=production
DATABASE_URL="postgresql://prod-user:pass@db-host:5432/prod-db"
JWT_SECRET="production-secret-key-with-sufficient-entropy"
REDIS_URL="redis://redis-host:6379"
BANK_API_URL="https://api.bank.com/v1"
BANK_API_KEY="prod-api-key"
BANK_API_SECRET="prod-api-secret"
```

### 4. Build and Deploy

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or with PM2
pm2 start dist/index.js --name "transfer-service"
```

## 🔒 Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Admin Authorization**: Admin endpoints require ADMIN role
- **Input Validation**: Comprehensive validation for all inputs
- **Data Sanitization**: Removes circular references and XSS vectors
- **Rate Limiting**: Built-in rate limiting middleware
- **CORS Protection**: Configurable CORS origins
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 📊 Monitoring

### Connection Stats
```typescript
import { getSocketService } from './socket/socket';

const stats = getSocketService().getStats();
// { connectedUsers: 150, totalConnections: 200, rooms: [...] }
```

### Transfer Statistics
```http
GET /api/admin/transfer-stats
Authorization: Bearer <admin-jwt-token>
```

Returns:
```json
{
  "success": true,
  "data": {
    "counts": {
      "pending": 25,
      "processing": 5,
      "completed": 1000,
      "rejected": 15,
      "failed": 2,
      "total": 1047
    },
    "totalVolume": 2500000
  }
}
```

## 🚦 Error Handling

All errors return consistent format:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "data": null
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing JWT)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (transfer not found)
- `500` - Internal Server Error (system errors)

## 📈 Performance Considerations

### Database Indexes
The migration creates optimal indexes:
- `transactions_userId_idx` - User-specific queries
- `transactions_status_idx` - Status filtering
- `transactions_type_idx` - Transfer type filtering
- `transactions_userId_type_status_idx` - Compound queries
- `transactions_type_status_created_idx` - Admin pending list

### Memory Usage
- In-process queue has minimal memory footprint
- Socket.IO maintains user room mappings
- Prisma connection pooling
- Data sanitization prevents memory leaks

### Scaling Options
1. **Horizontal scaling**: Multiple server instances with Redis for socket coordination
2. **Queue scaling**: BullMQ workers on separate processes/servers
3. **Database scaling**: Read replicas for transfer history queries
4. **CDN**: Static assets and API responses caching

## 🔧 Development

### File Watching
```bash
npm run dev  # Uses tsx with hot reload
```

### Database Reset
```bash
npx prisma migrate reset
psql $DATABASE_URL -f scripts/migrate-transfer-system.sql
```

### Debugging
```bash
DEBUG=socket.io:* npm run dev  # Socket.IO debug logs
NODE_ENV=development npm run dev  # Detailed error messages
```

## 📋 Troubleshooting

### Common Issues

**Socket.IO not connecting:**
- Check JWT token in localStorage
- Verify CORS origins in environment
- Check network connectivity

**Transfer creation fails:**
- Verify user balance is sufficient
- Check recipient info validation
- Ensure database connection is healthy

**Admin endpoints return 403:**
- Verify user has ADMIN role in database
- Check JWT token contains correct role claim

**Migration fails:**
- Check PostgreSQL permissions
- Verify database connection string
- Run migration manually section by section

### Debug Checklist
1. Check server logs for detailed error messages
2. Verify environment variables are loaded
3. Test database connectivity with `psql $DATABASE_URL`
4. Verify JWT secret matches between client and server
5. Check Socket.IO network tab in browser dev tools

---

**🎉 The clean transfer system is now ready for production use!**

For additional support or feature requests, please check the test suite and inline code documentation.