#!/bin/bash

# NeonHub v2.5.0 - Health Check Script
# Verify all services are running

echo "🔍 NeonHub v2.5.0 - Health Check"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

# Check PostgreSQL
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if docker ps | grep -q "neonhub-postgres"; then
    echo -e "${GREEN}✅ PostgreSQL container running${NC}"
    
    # Test connection
    if docker exec neonhub-postgres-v2.5 pg_isready -U neonhub &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL accepting connections${NC}"
    else
        echo -e "${RED}❌ PostgreSQL not accepting connections${NC}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL container not found${NC}"
fi

# Check Backend
echo ""
echo -e "${BLUE}Checking Backend API...${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3001/health)
    echo -e "${GREEN}✅ Backend API responding${NC}"
    echo -e "   Response: $HEALTH"
else
    echo -e "${RED}❌ Backend API not responding on :3001${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check UI
echo ""
echo -e "${BLUE}Checking UI...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ UI responding on :3000${NC}"
    
    # Check if it's actually Next.js
    if curl -s http://localhost:3000 | grep -q "next"; then
        echo -e "${GREEN}✅ Next.js application detected${NC}"
    fi
else
    echo -e "${RED}❌ UI not responding on :3000${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check Redis (optional)
echo ""
echo -e "${BLUE}Checking Redis (optional)...${NC}"
if docker ps | grep -q "neonhub-redis"; then
    echo -e "${GREEN}✅ Redis container running${NC}"
    
    if docker exec neonhub-redis-v2.5 redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis responding to PING${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Redis container not found (optional)${NC}"
fi

# Docker Compose Status
echo ""
echo -e "${BLUE}Docker Compose Services:${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose ps 2>/dev/null || echo -e "${YELLOW}No docker-compose services found${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical services healthy!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Start services: docker-compose up -d"
    echo "2. Check logs: docker-compose logs -f"
    echo "3. Restart: docker-compose restart"
    exit 1
fi

