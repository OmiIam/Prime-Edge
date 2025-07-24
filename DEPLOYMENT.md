# 🚀 PrimeEdge Production Deployment Guide

## Overview
This guide will help you deploy the PrimeEdge banking platform with:
- **Frontend**: Vercel (React/Vite)
- **Backend**: Railway (Node.js/Express)
- **Database**: Neon PostgreSQL

---

## 🗄️ Step 1: Database Setup (Neon)

1. **Create Neon Account**: Go to [neon.tech](https://neon.tech)
2. **Create New Project**: 
   - Project name: `primeedge-banking`
   - Region: Choose closest to your users
3. **Get Connection String**: Copy the DATABASE_URL from your dashboard
4. **Run Migrations**:
   ```bash
   # Set your DATABASE_URL
   export DATABASE_URL="postgresql://username:password@host/database"
   
   # Push schema to database
   npm run db:push
   
   # Seed with demo data
   npm run seed
   ```

---

## 🖥️ Step 2: Backend Deployment (Railway)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **New Project**: 
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Connect your PrimeEdge repository
3. **Environment Variables**: Set these in Railway dashboard:
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   NODE_ENV=production
   PORT=5000
   ```
4. **Deploy**: Railway will auto-deploy from your main branch
5. **Get Backend URL**: Copy your Railway app URL (e.g., `https://primeedge-production.railway.app`)

### Alternative: Render Deployment
```bash
# If using Render instead of Railway
1. Go to render.com
2. New Web Service
3. Connect GitHub repo
4. Build Command: npm run build
5. Start Command: npm start
6. Add same environment variables
```

---

## 🌐 Step 3: Frontend Deployment (Vercel)

1. **Update API URL**: Create `.env.local` in project root:
   ```bash
   VITE_API_URL=https://your-railway-app.railway.app
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_URL`: Your Railway backend URL

4. **Custom Domain** (Optional):
   - Add your domain in Vercel dashboard
   - Update DNS records as instructed

---

## 🔧 Step 4: Final Configuration

### Update Backend CORS (if needed)
Add to `server/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'https://your-domain.com'],
  credentials: true
}));
```

### Update Frontend API URL
In `client/src/lib/queryClient.ts`, replace the placeholder:
```typescript
return import.meta.env.VITE_API_URL || 'https://your-actual-railway-url.railway.app';
```

---

## ✅ Step 5: Testing & Verification

### Test the Deployment:
1. **Visit Frontend URL**: Your Vercel deployment
2. **Test Registration**: Create a new account
3. **Test Login**: 
   - Admin: `admin@primeedge.bank` / `admin123`
   - User: `john.doe@email.com` / `user123`
4. **Test Admin Functions**:
   - User management
   - Fund operations
   - Transaction creation
   - Activity logs

### Health Checks:
- **Backend Health**: `https://your-backend.railway.app/api/health`
- **Database**: Verify connections in Railway logs
- **Frontend**: All pages load without errors

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
- Railway: Auto-deploys on push to main branch
- Vercel: Auto-deploys on push to main branch

### Manual Deployment:
```bash
# Backend (Railway)
git push origin main

# Frontend (Vercel) 
vercel --prod
```

### Database Migrations:
```bash
# After schema changes
npm run db:push
```

---

## 🆘 Troubleshooting

### Common Issues:

**Frontend can't connect to backend:**
- Check VITE_API_URL environment variable
- Verify Railway backend is running
- Check CORS configuration

**Database connection errors:**
- Verify DATABASE_URL format
- Check Neon database status
- Ensure database exists and migrations ran

**Authentication not working:**
- Verify JWT_SECRET is set
- Check token expiration (24h default)
- Clear browser storage and try again

**Admin panel not accessible:**
- Ensure user has 'admin' role in database
- Check route protection logic
- Verify JWT token includes role

---

## 📞 Support

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)

---

## 🎯 Production URLs

After deployment, update this section with your actual URLs:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
- **Database**: Neon PostgreSQL
- **Admin Panel**: `https://your-app.vercel.app/admin`

---

**Your PrimeEdge banking platform is now production-ready! 🎉**