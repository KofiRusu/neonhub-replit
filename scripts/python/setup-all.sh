#!/bin/bash

# ==========================================================
# NeonHub Python Environment Master Setup
# Sets up both venv and conda environments for prod and test
# Usage: ./scripts/python/setup-all.sh
# ==========================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_DIR="${PROJECT_ROOT}/scripts/python"

echo -e "${MAGENTA}========================================${NC}"
echo -e "${MAGENTA}🐍 NeonHub Python Environment Setup${NC}"
echo -e "${MAGENTA}========================================${NC}"
echo ""

echo -e "${BLUE}This script will set up:${NC}"
echo "  1. Python venv (production)"
echo "  2. Python venv (test)"
echo "  3. Conda environment (production) - if conda available"
echo "  4. Conda environment (test) - if conda available"
echo ""

read -p "Continue? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Setting up venv environments...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Setup venv production
echo -e "${YELLOW}Setting up venv (production)...${NC}"
"${SCRIPT_DIR}/setup-venv.sh" prod

echo ""
echo -e "${YELLOW}Setting up venv (test)...${NC}"
"${SCRIPT_DIR}/setup-venv.sh" test

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Checking for conda...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Setup conda if available
if command -v conda &> /dev/null; then
    echo -e "${GREEN}✓ Conda detected${NC}"
    echo ""
    
    read -p "Set up conda environments? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo -e "${YELLOW}Setting up conda (production)...${NC}"
        "${SCRIPT_DIR}/setup-conda.sh" prod
        
        echo ""
        echo -e "${YELLOW}Setting up conda (test)...${NC}"
        "${SCRIPT_DIR}/setup-conda.sh" test
    else
        echo "Skipping conda setup."
    fi
else
    echo -e "${YELLOW}⚠ Conda not found - skipping conda setup${NC}"
    echo "To use conda environments later, install Miniconda:"
    echo "https://docs.conda.io/en/latest/miniconda.html"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Running environment tests...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test venv environments
echo -e "${YELLOW}Testing venv (production)...${NC}"
"${SCRIPT_DIR}/test-python-env.sh" venv prod

echo ""
echo -e "${YELLOW}Testing venv (test)...${NC}"
"${SCRIPT_DIR}/test-python-env.sh" venv test

# Test conda environments if they exist
if command -v conda &> /dev/null; then
    if conda env list | grep -q "neonhub-prod"; then
        echo ""
        echo -e "${YELLOW}Testing conda (production)...${NC}"
        "${SCRIPT_DIR}/test-python-env.sh" conda prod
    fi
    
    if conda env list | grep -q "neonhub-test"; then
        echo ""
        echo -e "${YELLOW}Testing conda (test)...${NC}"
        "${SCRIPT_DIR}/test-python-env.sh" conda test
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All Python environments ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${BLUE}Quick Reference:${NC}"
echo ""
echo -e "${YELLOW}Activate venv (production):${NC}"
echo "  source .venv/activate-prod.sh"
echo ""
echo -e "${YELLOW}Activate venv (test):${NC}"
echo "  source .venv/activate-test.sh"
echo ""

if command -v conda &> /dev/null; then
    echo -e "${YELLOW}Activate conda (production):${NC}"
    echo "  conda activate neonhub-prod"
    echo ""
    echo -e "${YELLOW}Activate conda (test):${NC}"
    echo "  conda activate neonhub-test"
    echo ""
fi

echo -e "${BLUE}Documentation:${NC}"
echo "  python/README.md"
echo ""

