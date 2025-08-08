# Clean Money Transfer System

A production-ready money transfer system built with Node.js, Express, Prisma ORM, and Socket.IO for real-time notifications.

## 🚀 Features

- **Secure Transfer Creation**: POST endpoint for creating external bank transfers
- **Real-time Notifications**: WebSocket events for transfer status updates
- **Admin Approval Workflow**: Admin interface for reviewing and approving transfers
- **JWT Authentication**: Secure authentication for all API endpoints
- **Data Sanitization**: Prevents circular references and ensures JSON safety
- **Polling Fallback**: GET endpoint for clients without WebSocket support
- **Production Ready**: Error handling, logging, and graceful shutdown

## 📋 API Endpoints

### User Endpoints
- `POST /api/user/transfer` - Create a pending external bank transfer
- `GET /api/user/transfer-updates` - Get latest transfer status updates
- `GET /api/user/transactions` - Get paginated transaction history

### Admin Endpoints  
- `GET /api/admin/pending-transfers` - Get all pending transfers for review
- `POST /api/admin/transfers/:id/review` - Approve or reject a transfer
- `GET /api/admin/transfer-stats` - Get transfer statistics

### System Endpoints
- `GET /health` - Health check endpoint

## 🔌 WebSocket Events

### Client → Server
- `request_transfer_updates` - Request latest transfer updates
- `ping` - Connection health check

### Server → Client
- `transfer_pending` - Emitted when transfer is created
- `transfer_update` - Emitted when transfer is approved/rejected
- `transfer_updates` - Bulk transfer updates
- `system_notification` - System-wide notifications
- `pong` - Heartbeat response

## 🛠 Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd clean-transfer-system
npm install
```

2. **Setup environment variables**
```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/transfers"
JWT_SECRET="your-super-secure-jwt-secret"
CLIENT_URL="http://localhost:3000"
PORT=3001
NODE_ENV="development"
```

3. **Setup database**
```bash
npm run db:generate
npm run db:migrate
```

4. **Start development server**
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── middleware/
│   └── auth.ts              # JWT authentication middleware
├── routes/
│   ├── user.ts             # User transfer routes
│   └── admin.ts            # Admin approval routes
├── services/
│   └── socketService.ts    # WebSocket service
├── utils/
│   └── sanitizer.ts        # Data sanitization utilities
├── server.ts               # Express server entry point
└── types/                  # TypeScript type definitions

prisma/
├── schema.prisma           # Database schema
└── migrations/            # Database migrations

frontend/
└── socketClient.ts        # Frontend WebSocket client example
```

## 💾 Database Schema

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String
  password     String        // Hashed
  role         Role          @default(USER)
  balance      Float         @default(0)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          String            @id @default(cuid())
  userId      String
  type        TransactionType   
  amount      Float
  status      TransactionStatus @default(PENDING)
  description String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  metadata    Json?             // Flexible transfer details
  user        User              @relation(fields: [userId], references: [id])
}
```

## 🔐 Authentication

All API endpoints (except `/health`) require JWT authentication via the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

Admin endpoints additionally require the user to have `ADMIN` role.

## 📝 Usage Examples

### Creating a Transfer
```javascript
const response = await fetch('/api/user/transfer', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    recipientInfo: '1234567890',
    bankName: 'Chase Bank',
    description: 'Payment to supplier'
  })
});

const result = await response.json();
// { success: true, message: "Transfer submitted...", data: {...} }
```

### WebSocket Connection
```javascript
import { TransferSocketClient } from './frontend/socketClient';

const client = new TransferSocketClient();

// Connect with JWT token
await client.connect('your-jwt-token');

// Listen for transfer updates
client.on('transfer_pending', (data) => {
  console.log('Transfer submitted:', data);
});

client.on('transfer_update', (data) => {
  if (data.status === 'approved') {
    showSuccessNotification(data.message);
  } else {
    showErrorNotification(data.message);
  }
});
```

### Admin Transfer Review
```javascript
const response = await fetch(`/api/admin/transfers/${transferId}/review`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'approve', // or 'reject'
    reason: 'Transfer verified and approved'
  })
});
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `CLIENT_URL` - Frontend URL for CORS configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Security Features
- JWT token expiration (24 hours)
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention via Prisma
- CORS protection
- Rate limiting ready (easily extensible)

## 🚦 Production Deployment

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**
```bash
export NODE_ENV=production
export DATABASE_URL="your-production-db-url"
export JWT_SECRET="your-production-secret"
```

3. **Run migrations**
```bash
npm run db:migrate
```

4. **Start production server**
```bash
npm start
```

## 🔍 Monitoring

The system includes:
- Health check endpoint (`/health`)
- Comprehensive logging
- WebSocket connection statistics
- Error tracking and reporting
- Graceful shutdown handling

## 🤝 Contributing

1. Follow the established code structure
2. Add proper TypeScript types
3. Include error handling and logging
4. Test WebSocket events thoroughly
5. Update documentation for new features

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for secure, real-time money transfers**