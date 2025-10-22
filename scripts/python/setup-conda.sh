#!/bin/bash

# ==========================================================
# NeonHub Conda Environment Setup Script
# Creates and configures Conda environments
# Usage: ./scripts/python/setup-conda.sh [prod|test]
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NeonHub Conda Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Determine environment type
ENV_TYPE="${1:-prod}"

if [[ "$ENV_TYPE" != "prod" && "$ENV_TYPE" != "test" ]]; then
    echo -e "${RED}Error: Invalid environment type '$ENV_TYPE'${NC}"
    echo "Usage: $0 [prod|test]"
    exit 1
fi

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo -e "${RED}Error: conda not found${NC}"
    echo "Please install Miniconda or Anaconda from:"
    echo "https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo -e "${GREEN}✓ Conda detected: $(conda --version)${NC}"
echo ""

# Select environment file
if [ "$ENV_TYPE" = "test" ]; then
    ENV_FILE="${PYTHON_DIR}/environment-test.yml"
    ENV_NAME="neonhub-test"
else
    ENV_FILE="${PYTHON_DIR}/environment.yml"
    ENV_NAME="neonhub-prod"
fi

# Check if environment already exists
if conda env list | grep -q "^${ENV_NAME} "; then
    echo -e "${YELLOW}Environment '${ENV_NAME}' already exists.${NC}"
    read -p "Do you want to remove it and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing environment...${NC}"
        conda env remove -n "$ENV_NAME" -y
        echo -e "${GREEN}✓ Environment removed${NC}"
    else
        echo -e "${YELLOW}Updating existing environment...${NC}"
        conda env update -n "$ENV_NAME" -f "$ENV_FILE" --prune
        echo -e "${GREEN}✓ Environment updated${NC}"
        exit 0
    fi
fi

# Create new environment
echo -e "${YELLOW}Creating conda environment: ${ENV_NAME}...${NC}"
conda env create -f "$ENV_FILE"

echo -e "${GREEN}✓ Environment created${NC}"
echo ""

# Create activation helper script
ACTIVATE_SCRIPT="${PROJECT_ROOT}/.conda-activate-${ENV_TYPE}.sh"
cat > "$ACTIVATE_SCRIPT" << EOF
#!/bin/bash
# Activation helper for NeonHub Conda environment (${ENV_TYPE})
eval "\$(conda shell.bash hook)"
conda activate ${ENV_NAME}
echo "NeonHub Conda environment (${ENV_TYPE}) activated"
echo "Python: \$(python --version)"
echo "Environment: ${ENV_NAME}"
EOF

chmod +x "$ACTIVATE_SCRIPT"

# Verification
echo -e "${YELLOW}Verifying installation...${NC}"
eval "$(conda shell.bash hook)"
conda activate "$ENV_NAME"
python -c "import pandas, numpy, matplotlib, reportlab; print('Core packages verified')"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Environment: ${BLUE}${ENV_TYPE}${NC}"
echo -e "Name: ${BLUE}${ENV_NAME}${NC}"
echo ""
echo -e "To activate this environment, run:"
echo -e "${YELLOW}conda activate ${ENV_NAME}${NC}"
echo ""
echo -e "Or use the helper script:"
echo -e "${YELLOW}source ${ACTIVATE_SCRIPT}${NC}"
echo ""
echo -e "To deactivate:"
echo -e "${YELLOW}conda deactivate${NC}"
echo ""
echo -e "View environment packages:"
echo -e "${YELLOW}conda list${NC}"
echo ""
echo -e "Export environment:"
echo -e "${YELLOW}conda env export > environment-snapshot.yml${NC}"
echo ""

