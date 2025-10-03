#!/bin/bash

# NeonHub v2.5.0 - Vercel Deployment Script
# Automated deployment to Vercel

set -e

echo "🚀 NeonHub v2.5.0 - Vercel Deployment"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Vercel CLI
echo -e "${BLUE}Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi

# Navigate to UI directory
cd "$(dirname "$0")/../ui"

# Check if logged in
echo ""
echo -e "${BLUE}Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Authenticated${NC}"

# Build locally first (optional check)
echo ""
echo -e "${BLUE}Testing build locally...${NC}"
npm run build
echo -e "${GREEN}✅ Local build successful${NC}"

# Deploy
echo ""
echo -e "${BLUE}Deploying to Vercel...${NC}"
echo ""

# Ask for environment
echo -e "${YELLOW}Select deployment environment:${NC}"
echo "1) Production (--prod)"
echo "2) Preview (default)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo -e "${BLUE}Deploying to PRODUCTION...${NC}"
        vercel --prod
        ;;
    *)
        echo -e "${BLUE}Deploying PREVIEW...${NC}"
        vercel
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Configure environment variables in Vercel dashboard${NC}"
echo -e "   https://vercel.com/dashboard"
echo ""
echo -e "2. ${YELLOW}Required environment variables:${NC}"
echo -e "   - DATABASE_URL"
echo -e "   - NEXTAUTH_SECRET"
echo -e "   - NEXTAUTH_URL"
echo -e "   - NEXT_PUBLIC_API_URL"
echo ""
echo -e "3. ${YELLOW}Redeploy after setting env vars:${NC}"
echo -e "   vercel --prod"
echo ""
echo -e "${BLUE}For more help, see DEPLOYMENT.md${NC}"
echo ""

