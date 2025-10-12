#!/bin/bash
# Web App Deployment Script

set -e

echo "🚀 Starting Web deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --workspace=apps/web

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate --workspace=apps/web

# Build application
echo "🏗️  Building application..."
npm run build --workspace=apps/web

echo "✅ Web deployment complete!"

