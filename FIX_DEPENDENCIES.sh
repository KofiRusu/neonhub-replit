#!/bin/bash
# NeonHub - Fix Dependencies and Start UI
# Run this script when you have internet connectivity

set -e

echo "🔧 NeonHub Dependency Fix Script"
echo "=================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Step 1: Clearing offline cache..."
rm -rf node_modules/.pnpm
rm -rf node_modules
rm -rf ~/.npm/_cacache

echo "📦 Step 2: Installing dependencies with pnpm..."
pnpm install --no-frozen-lockfile

echo "📦 Step 3: Generating Prisma client..."
cd apps/api
npx prisma generate
cd ../..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Starting NeonHub UI..."
echo "   Web UI: http://localhost:3000"
echo "   API: http://localhost:3001"
echo ""
echo "   Demo Login:"
echo "   Email: demo@neonhub.ai"
echo "   Password: demo-access"
echo ""

# Start the dev servers
pnpm dev


