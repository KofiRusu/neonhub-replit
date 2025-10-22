#!/bin/bash

# ==========================================================
# NeonHub Python venv Setup Script
# Creates and configures Python virtual environments
# Usage: ./scripts/python/setup-venv.sh [prod|test]
# ==========================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PYTHON_DIR="${PROJECT_ROOT}/python"
VENV_DIR="${PROJECT_ROOT}/.venv"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NeonHub Python venv Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Determine environment type
ENV_TYPE="${1:-prod}"

if [[ "$ENV_TYPE" != "prod" && "$ENV_TYPE" != "test" ]]; then
    echo -e "${RED}Error: Invalid environment type '$ENV_TYPE'${NC}"
    echo "Usage: $0 [prod|test]"
    exit 1
fi

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [[ $PYTHON_MAJOR -lt 3 || ($PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -lt 10) ]]; then
    echo -e "${RED}Error: Python 3.10+ required. Found: $PYTHON_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python $PYTHON_VERSION detected${NC}"
echo ""

# Create venv directory structure
VENV_PATH="${VENV_DIR}/${ENV_TYPE}"

if [ -d "$VENV_PATH" ]; then
    echo -e "${YELLOW}Removing existing venv at: ${VENV_PATH}${NC}"
    rm -rf "$VENV_PATH"
fi

echo -e "${YELLOW}Creating Python virtual environment for ${ENV_TYPE}...${NC}"
python3 -m venv "$VENV_PATH"

echo -e "${GREEN}✓ Virtual environment created${NC}"
echo ""

# Activate venv
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "${VENV_PATH}/bin/activate"

# Upgrade pip, setuptools, and wheel
echo -e "${YELLOW}Upgrading pip, setuptools, and wheel...${NC}"
pip install --upgrade pip setuptools wheel

echo -e "${GREEN}✓ Base tools upgraded${NC}"
echo ""

# Install dependencies
if [ "$ENV_TYPE" = "test" ]; then
    REQ_FILE="${PYTHON_DIR}/requirements-test.txt"
    echo -e "${YELLOW}Installing test dependencies...${NC}"
else
    REQ_FILE="${PYTHON_DIR}/requirements.txt"
    echo -e "${YELLOW}Installing production dependencies...${NC}"
fi

pip install -r "$REQ_FILE"

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create activation helper script
ACTIVATE_SCRIPT="${VENV_DIR}/activate-${ENV_TYPE}.sh"
cat > "$ACTIVATE_SCRIPT" << EOF
#!/bin/bash
# Activation helper for NeonHub Python venv (${ENV_TYPE})
source "${VENV_PATH}/bin/activate"
echo "NeonHub Python venv (${ENV_TYPE}) activated"
echo "Python: \$(python --version)"
echo "Location: ${VENV_PATH}"
EOF

chmod +x "$ACTIVATE_SCRIPT"

# Create environment info script
ENV_INFO_SCRIPT="${VENV_PATH}/bin/env-info"
cat > "$ENV_INFO_SCRIPT" << 'EOF'
#!/bin/bash
echo "=========================================="
echo "NeonHub Python Environment Info"
echo "=========================================="
echo "Environment Type: ${ENV_TYPE}"
echo "Python Version: $(python --version)"
echo "Pip Version: $(pip --version)"
echo "Virtual Environment: ${VIRTUAL_ENV}"
echo ""
echo "Installed Packages:"
pip list
EOF

chmod +x "$ENV_INFO_SCRIPT"

# Verification
echo -e "${YELLOW}Verifying installation...${NC}"
python -c "import pandas, numpy, matplotlib, reportlab; print('Core packages verified')"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Environment: ${BLUE}${ENV_TYPE}${NC}"
echo -e "Location: ${BLUE}${VENV_PATH}${NC}"
echo ""
echo -e "To activate this environment, run:"
echo -e "${YELLOW}source ${ACTIVATE_SCRIPT}${NC}"
echo ""
echo -e "Or manually:"
echo -e "${YELLOW}source ${VENV_PATH}/bin/activate${NC}"
echo ""
echo -e "To deactivate:"
echo -e "${YELLOW}deactivate${NC}"
echo ""
echo -e "View environment info:"
echo -e "${YELLOW}env-info${NC}"
echo ""

