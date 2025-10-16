#!/bin/bash
# API Deployment Script for Railway/Render

set -e

echo "🚀 Starting API deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️  Building application..."
npm run build

echo "✅ API build complete!"
echo "ℹ️  Migrations will run automatically on container start via: npx prisma migrate deploy"

# Note: Health check and migrations happen at runtime in production

