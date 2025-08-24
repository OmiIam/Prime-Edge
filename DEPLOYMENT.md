# 🚀 PrimeEdge Production Deployment Guide

## Overview
This guide will help you deploy the PrimeEdge banking platform as a **full-stack single service** with:
- **Full-Stack Application**: Render (React/Vite frontend + Node.js/Express backend)
- **Database**: Railway PostgreSQL
- **Architecture**: Single service deployment serving both frontend and API

---

## 🗄️ Step 1: Database Setup (Railway PostgreSQL)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Add PostgreSQL Database**:
   - Click "New Project"
   - Add "PostgreSQL" service
   - Note the connection details from the "Connect" tab
3. **Get Connection String**: Copy the external DATABASE_URL from Railway dashboard
4. **Run Migrations** (locally first):
   ```bash
   # Set your DATABASE_URL
   export DATABASE_URL="your-railway-postgresql-connection-string"
   
   # Push schema to database  
   npm run db:push
   
   # Seed with demo data
   npm run seed
   ```

---

## 🚀 Step 2: Full-Stack Deployment (Render)

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose your PrimeEdge repository and branch

3. **Configure Service**:
   - **Name**: `prime-edge`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Choose based on your needs

4. **Environment Variables**: Add these in Render dashboard:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   PORT=10000
   MAINTENANCE_MODE=false
   LOG_LEVEL=info
   MOCK_BANK_DELAY_MS=1000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ALLOWED_ORIGINS=https://prime-edge.onrender.com
   SOCKET_IO_CORS_ORIGINS=https://prime-edge.onrender.com
   DATABASE_URL=your-railway-postgresql-connection-string
   ```

5. **Deploy**: Click "Create Web Service" - Render will auto-deploy
6. **Get App URL**: Your app will be available at `https://prime-edge.onrender.com`

---

## ✅ Step 3: Testing & Verification

### Test the Deployment:
1. **Visit App URL**: `https://prime-edge.onrender.com`
2. **Test Registration**: Create a new account
3. **Test Login**: 
   - Admin: `admin@primeedge.bank` / `admin123`
   - User: `user@primeedge.bank` / `user123`
4. **Test Admin Functions**:
   - User management: `https://prime-edge.onrender.com/admin`
   - Fund operations
   - Transaction creation
   - Activity logs

### Health Checks:
- **Health Endpoint**: `https://prime-edge.onrender.com/health`
- **API Endpoints**: `https://prime-edge.onrender.com/api/*`
- **Frontend**: All pages load without errors
- **WebSocket**: Real-time updates working
- **Database**: Verify connections in Render logs

---

## 🔧 Step 4: Custom Domain (Optional)

1. **Add Custom Domain** in Render dashboard:
   - Go to your service settings
   - Add your custom domain (e.g., `banking.yourdomain.com`)
   
2. **Update Environment Variables** with new domain:
   ```bash
   ALLOWED_ORIGINS=https://banking.yourdomain.com
   SOCKET_IO_CORS_ORIGINS=https://banking.yourdomain.com
   ```

3. **Update DNS Records** as instructed by Render

---

## 🔐 Security Checklist

- ✅ Strong JWT_SECRET (32+ characters)
- ✅ DATABASE_URL properly secured
- ✅ HTTPS enforced on all deployments
- ✅ Environment variables not in code
- ✅ CORS properly configured
- ✅ Admin routes protected

---

## 📊 Monitoring

### Railway Dashboard:
- View deployment logs
- Monitor resource usage
- Set up alerts

### Vercel Analytics:
- Enable Web Analytics
- Monitor frontend performance
- Track user engagement

---

## 🔄 Updates & Maintenance

### Automatic Deployments:
- Render: Auto-deploys on push to connected branch (usually main)

### Manual Deployment:
```bash
# Trigger deployment
git push origin main

# Or redeploy from Render dashboard
```

### Database Migrations:
```bash
# After schema changes
npm run db:push
```

---

## 🆘 Troubleshooting

### Common Issues:

**Frontend can't reach API:**
- Both frontend and API are served from same domain
- Check CORS configuration in server/index.ts
- Verify Render service is running

**Database connection errors:**
- Verify DATABASE_URL format in Render environment variables
- Check Railway PostgreSQL database status
- Ensure database exists and migrations ran
- App continues in demo mode if database unavailable

**Authentication not working:**
- Verify JWT_SECRET is set
- Check token expiration (24h default)
- Clear browser storage and try again

**Admin panel not accessible:**
- Ensure user has 'ADMIN' role in database (uppercase)
- Check route protection logic  
- Verify JWT token includes role
- Default admin: admin@primeedge.bank / admin123

---

## 📞 Support

- **Render**: [render.com/docs](https://render.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)

---

## 🎯 Production URLs

After deployment, update this section with your actual URLs:

- **Full Application**: `https://prime-edge.onrender.com`
- **API Endpoints**: `https://prime-edge.onrender.com/api/*`
- **Admin Panel**: `https://prime-edge.onrender.com/admin`
- **Health Check**: `https://prime-edge.onrender.com/health`
- **Database**: Railway PostgreSQL

---

---

## 📋 Current Implementation Status

### ✅ Completed Features:
- **Full Prisma Migration**: Complete migration from Drizzle to Prisma ORM
- **JWT Authentication**: Secure login/register system with proper token management
- **Admin Dashboard**: Comprehensive admin panel with:
  - User management (view, edit, activate/deactivate, delete)
  - Balance management (add/subtract funds with logging)
  - Dashboard statistics and overview
  - Activity logs with detailed admin action tracking
  - Responsive design with tabs and modals
- **Database Schema**: Proper PostgreSQL schema with User, Transaction, AdminLog models
- **API Endpoints**: Complete REST API with proper validation and error handling
- **Frontend Integration**: Updated React components with proper type checking
- **Deployment Ready**: Configured for Railway (backend) and Vercel (frontend)

### 🔧 Technical Implementation:
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + TanStack Query + Tailwind CSS
- **Authentication**: JWT-based with role-based access control
- **Database**: PostgreSQL with UUID primary keys and proper relationships
- **Validation**: Zod schema validation throughout
- **Error Handling**: Comprehensive error handling and user feedback

### 🎯 Ready for Production:
The application is fully functional and production-ready. All major features have been implemented and tested. The codebase includes proper error handling, logging, and security measures.

**Your PrimeEdge banking platform is now production-ready! 🎉**