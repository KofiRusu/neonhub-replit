#!/bin/bash
# Web App Deployment Script for Vercel

set -e

echo "🚀 Starting Web deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client  
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️  Building application..."
npm run build

echo "✅ Web build complete!"
echo "ℹ️  Deploy to Vercel using: vercel --prod"
echo "ℹ️  Or use GitHub integration for automatic deployments"

