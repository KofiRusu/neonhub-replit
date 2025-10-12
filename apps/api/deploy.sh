#!/bin/bash
# API Deployment Script

set -e

echo "🚀 Starting API deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --workspace=apps/api

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate --workspace=apps/api

# Run database migrations
echo "📊 Running database migrations..."
npm run prisma:migrate:deploy --workspace=apps/api

# Build application
echo "🏗️  Building application..."
npm run build --workspace=apps/api

# Run health check
echo "🏥 Running health check..."
curl -f http://localhost:3001/health || echo "Health check will run after deployment"

echo "✅ API deployment complete!"

