#!/bin/bash

# NeonHub v2.5.0 - Setup Script
# Automated setup for local development

set -e

echo "🚀 NeonHub v2.5.0 Setup"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check Docker (optional)
echo -e "${BLUE}Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found (optional for PostgreSQL)${NC}"
    DOCKER_AVAILABLE=false
else
    echo -e "${GREEN}✅ Docker found${NC}"
    DOCKER_AVAILABLE=true
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Install UI dependencies
echo ""
echo -e "${BLUE}Installing UI dependencies...${NC}"
cd ui
npm install
npx prisma generate
echo -e "${GREEN}✅ UI dependencies installed${NC}"

# Install Backend dependencies
echo ""
echo -e "${BLUE}Installing Backend dependencies...${NC}"
cd ../backend
npm install
npx prisma generate
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Setup environment files
echo ""
echo -e "${BLUE}Setting up environment files...${NC}"

# UI .env.local
if [ ! -f "../ui/.env.local" ]; then
    cat > ../ui/.env.local << 'EOF'
# NeonHub UI Configuration
DATABASE_URL="postgresql://neonhub:neonhub@localhost:5432/neonhub"
NEXTAUTH_SECRET="change-this-to-a-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
EOF
    echo -e "${GREEN}✅ Created ui/.env.local${NC}"
else
    echo -e "${YELLOW}⚠️  ui/.env.local already exists, skipping${NC}"
fi

# Backend .env
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# NeonHub Backend Configuration
DATABASE_URL="postgresql://neonhub:neonhub@localhost:5432/neonhub"
PORT=3001
NODE_ENV=development
HOST=127.0.0.1
JWT_SECRET="change-this-to-a-random-jwt-secret"
OPENAI_API_KEY="sk-your-openai-api-key-here"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
LOG_LEVEL="info"
EOF
    echo -e "${GREEN}✅ Created backend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  backend/.env already exists, skipping${NC}"
fi

# Start PostgreSQL
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${BLUE}Starting PostgreSQL via Docker...${NC}"
    cd ..
    docker-compose up -d postgres
    
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
    
    if docker-compose ps postgres | grep -q "Up"; then
        echo -e "${GREEN}✅ PostgreSQL started${NC}"
        
        # Run migrations
        echo ""
        echo -e "${BLUE}Running database migrations...${NC}"
        cd backend
        npx prisma migrate dev --name init || true
        echo -e "${GREEN}✅ Database migrations complete${NC}"
        
        cd ../ui
        npx prisma migrate dev --name init || true
    else
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available. Please start PostgreSQL manually:${NC}"
    echo -e "${YELLOW}   postgresql://neonhub:neonhub@localhost:5432/neonhub${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Update environment variables:${NC}"
echo -e "   - ui/.env.local (NEXTAUTH_SECRET, API keys)"
echo -e "   - backend/.env (JWT_SECRET, OPENAI_API_KEY)"
echo ""
echo -e "2. ${YELLOW}Start the backend:${NC}"
echo -e "   cd backend && npm run dev"
echo ""
echo -e "3. ${YELLOW}Start the UI (new terminal):${NC}"
echo -e "   cd ui && npm run dev"
echo ""
echo -e "4. ${YELLOW}Open browser:${NC}"
echo -e "   http://localhost:3000"
echo ""
echo -e "${BLUE}For more help, see:${NC}"
echo -e "   - QUICKSTART.md"
echo -e "   - DEPLOYMENT.md"
echo -e "   - README.md"
echo ""

