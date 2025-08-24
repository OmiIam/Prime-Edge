#!/bin/bash

# Render Environment Variable Setup Script
# Run this script to set up environment variables on Render

echo "🚀 Setting up environment variables for Prime-Edge on Render..."

# Service ID (from earlier render services list command)
SERVICE_ID="srv-d2l4177diees7380efig"

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo "📝 Setting NODE_ENV to production..."
render services env set $SERVICE_ID NODE_ENV production

echo "🔑 Setting JWT_SECRET..."
render services env set $SERVICE_ID JWT_SECRET "$JWT_SECRET"

echo "🚪 Setting PORT (Render will override this automatically)..."
render services env set $SERVICE_ID PORT 10000

echo "🔧 Setting MAINTENANCE_MODE to false..."
render services env set $SERVICE_ID MAINTENANCE_MODE false

echo "📊 Setting LOG_LEVEL to info..."
render services env set $SERVICE_ID LOG_LEVEL info

echo "⏱️  Setting MOCK_BANK_DELAY_MS to 1000 for production..."
render services env set $SERVICE_ID MOCK_BANK_DELAY_MS 1000

echo "🔒 Setting security configurations..."
render services env set $SERVICE_ID RATE_LIMIT_WINDOW_MS 900000
render services env set $SERVICE_ID RATE_LIMIT_MAX_REQUESTS 100

echo "🌐 Setting CORS origins..."
render services env set $SERVICE_ID ALLOWED_ORIGINS "https://prime-edge.onrender.com"
render services env set $SERVICE_ID SOCKET_IO_CORS_ORIGINS "https://prime-edge.onrender.com"

echo "✅ Environment variables set successfully!"
echo ""
echo "🔗 Next steps:"
echo "1. Set DATABASE_URL manually in Render dashboard with your PostgreSQL connection string"
echo "2. Deploy your service: render services deploy $SERVICE_ID"
echo "3. Check logs: render logs $SERVICE_ID"
echo ""
echo "Your service will be available at: https://prime-edge.onrender.com"