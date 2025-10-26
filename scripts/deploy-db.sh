#!/bin/bash

# =========================================================
# 🗄️ NeonHub Database Deployment Script (Option C)
# =========================================================
# Purpose: One-command database deployment with Prisma
# Usage: ./scripts/deploy-db.sh
# =========================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# =========================================================
# Helper Functions
# =========================================================

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# =========================================================
# Step 1: Verify Prerequisites
# =========================================================

log_info "🔍 Verifying prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed. Please install Node.js v20+"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  log_error "Node.js version must be >= 20. Currently: $(node -v)"
  exit 1
fi
log_success "Node.js $(node -v) ✓"

# Check npm
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed"
  exit 1
fi
log_success "npm $(npm -v) ✓"

# Check .env file
if [ ! -f .env ]; then
  log_error ".env file not found"
  log_info "Please create .env from ENV_TEMPLATE.example"
  exit 1
fi
log_success ".env file exists ✓"

# Verify DATABASE_URL
if ! grep -q "DATABASE_URL" .env; then
  log_error "DATABASE_URL not found in .env"
  exit 1
fi
log_success "DATABASE_URL configured ✓"

# =========================================================
# Step 2: Navigate to Project Root
# =========================================================

cd /Users/kofirusu/Desktop/NeonHub
log_success "Working directory: $(pwd)"

# =========================================================
# Step 3: Install Dependencies
# =========================================================

log_info "📦 Installing dependencies..."
log_info "This may take 2-5 minutes on first run..."

if npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -20; then
  log_success "Dependencies installed"
else
  log_error "Failed to install dependencies"
  exit 1
fi

# =========================================================
# Step 4: Generate Prisma Client
# =========================================================

log_info "🔨 Generating Prisma Client..."

if npm run prisma:generate --workspace=apps/api 2>&1 | tail -10; then
  log_success "Prisma Client generated"
else
  log_error "Failed to generate Prisma Client"
  exit 1
fi

# =========================================================
# Step 5: Run Migrations
# =========================================================

log_info "🚀 Running database migrations..."

if npm run prisma:migrate --workspace=apps/api -- dev --name full_org_ai_vector_bootstrap 2>&1 | tail -15; then
  log_success "Migrations applied successfully"
else
  log_error "Failed to run migrations"
  exit 1
fi

# =========================================================
# Step 6: Seed Database
# =========================================================

log_info "🌱 Seeding database with initial data..."

if npm run seed --workspace=apps/api 2>&1 | tail -15; then
  log_success "Database seeded successfully"
else
  log_error "Failed to seed database"
  exit 1
fi

# =========================================================
# Step 7: Verification
# =========================================================

log_info "🔍 Verifying deployment..."

# Check if Prisma Client exists
if [ -f "apps/api/node_modules/@prisma/client/index.d.ts" ]; then
  log_success "Prisma Client installed"
else
  log_warning "Prisma Client not found"
fi

# =========================================================
# Step 8: Success Summary
# =========================================================

cat << EOF

${GREEN}
╔════════════════════════════════════════════════════════╗
║     🎉 DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY     ║
╚════════════════════════════════════════════════════════╝

✅ Dependencies installed
✅ Prisma Client generated
✅ Migrations applied
✅ Database seeded

📊 Next Steps:

  1. Start API Server:
     npm run start:api

  2. Start Web App:
     npm run start:web

  3. View Database (Prisma Studio):
     npm run prisma:studio --workspace=apps/api

  4. Run Tests:
     npm run test:all

  5. Check Database Tables:
     psql $(grep DATABASE_URL .env | cut -d'=' -f2) -c "\\dt"

📝 Documentation:
   See DB_DEPLOYMENT_GUIDE.md for detailed information

${NC}
EOF

# =========================================================
# Step 9: Optionally Start Prisma Studio
# =========================================================

log_info "Would you like to open Prisma Studio? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
  log_info "Opening Prisma Studio at http://localhost:5555..."
  npm run prisma:studio --workspace=apps/api
else
  log_success "Setup complete! You can start the servers anytime with: npm run dev"
fi
