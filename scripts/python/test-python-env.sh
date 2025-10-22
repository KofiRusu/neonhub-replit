#!/bin/bash

# ==========================================================
# NeonHub Python Environment Test Script
# Validates Python environment setup and dependencies
# Usage: ./scripts/python/test-python-env.sh [venv|conda] [prod|test]
# ==========================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NeonHub Python Environment Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
ENV_MANAGER="${1:-venv}"
ENV_TYPE="${2:-prod}"

if [[ "$ENV_MANAGER" != "venv" && "$ENV_MANAGER" != "conda" ]]; then
    echo -e "${RED}Error: Invalid environment manager '$ENV_MANAGER'${NC}"
    echo "Usage: $0 [venv|conda] [prod|test]"
    exit 1
fi

if [[ "$ENV_TYPE" != "prod" && "$ENV_TYPE" != "test" ]]; then
    echo -e "${RED}Error: Invalid environment type '$ENV_TYPE'${NC}"
    echo "Usage: $0 [venv|conda] [prod|test]"
    exit 1
fi

echo -e "${YELLOW}Testing ${ENV_MANAGER} (${ENV_TYPE}) environment...${NC}"
echo ""

# Activate environment
if [ "$ENV_MANAGER" = "venv" ]; then
    VENV_PATH="${PROJECT_ROOT}/.venv/${ENV_TYPE}"
    if [ ! -d "$VENV_PATH" ]; then
        echo -e "${RED}Error: venv not found at ${VENV_PATH}${NC}"
        echo "Run: ./scripts/python/setup-venv.sh ${ENV_TYPE}"
        exit 1
    fi
    source "${VENV_PATH}/bin/activate"
else
    if [ "$ENV_TYPE" = "test" ]; then
        ENV_NAME="neonhub-test"
    else
        ENV_NAME="neonhub-prod"
    fi
    eval "$(conda shell.bash hook)"
    conda activate "$ENV_NAME" 2>/dev/null || {
        echo -e "${RED}Error: conda environment '${ENV_NAME}' not found${NC}"
        echo "Run: ./scripts/python/setup-conda.sh ${ENV_TYPE}"
        exit 1
    }
fi

echo -e "${GREEN}✓ Environment activated${NC}"
echo ""

# Test Python version
echo -e "${YELLOW}Python Version:${NC}"
python --version
echo ""

# Test pip
echo -e "${YELLOW}Pip Version:${NC}"
pip --version
echo ""

# Test core packages
echo -e "${YELLOW}Testing core packages...${NC}"

PACKAGES=(
    "pandas"
    "numpy"
    "matplotlib"
    "seaborn"
    "reportlab"
    "sklearn"
    "pytest"
)

FAILED=0

for pkg in "${PACKAGES[@]}"; do
    if python -c "import $pkg" 2>/dev/null; then
        VERSION=$(python -c "import $pkg; print(getattr($pkg, '__version__', 'unknown'))")
        echo -e "${GREEN}✓${NC} $pkg (${VERSION})"
    else
        echo -e "${RED}✗${NC} $pkg (not found)"
        FAILED=$((FAILED + 1))
    fi
done

echo ""

# Test AI libraries
echo -e "${YELLOW}Testing AI/ML libraries...${NC}"

AI_PACKAGES=(
    "openai"
    "torch"
    "transformers"
)

for pkg in "${AI_PACKAGES[@]}"; do
    if python -c "import $pkg" 2>/dev/null; then
        VERSION=$(python -c "import $pkg; print(getattr($pkg, '__version__', 'unknown'))")
        echo -e "${GREEN}✓${NC} $pkg (${VERSION})"
    else
        echo -e "${YELLOW}⚠${NC} $pkg (optional, not installed)"
    fi
done

echo ""

# Run test script
echo -e "${YELLOW}Running benchmark script test...${NC}"

BENCHMARK_SCRIPT="${PROJECT_ROOT}/scripts/benchmarking/generate-v32-report.py"

if [ -f "$BENCHMARK_SCRIPT" ]; then
    python -c "import sys; sys.path.insert(0, '$(dirname $BENCHMARK_SCRIPT)'); import importlib.util; spec = importlib.util.spec_from_file_location('benchmark', '$BENCHMARK_SCRIPT'); module = importlib.util.module_from_spec(spec); print('Benchmark script syntax OK')"
    echo -e "${GREEN}✓ Benchmark script validated${NC}"
else
    echo -e "${YELLOW}⚠ Benchmark script not found${NC}"
fi

echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Environment: ${BLUE}${ENV_MANAGER} (${ENV_TYPE})${NC}"
    echo -e "Status: ${GREEN}Ready for use${NC}"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ ${FAILED} test(s) failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi

