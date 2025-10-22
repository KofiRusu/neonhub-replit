# Python Environments Documentation

## Quick Links
- [Setup Guide](../PYTHON_SETUP.md) - Complete setup instructions
- [Python README](../python/README.md) - Detailed technical documentation
- [Activation Commands](../ACTIVATION_COMMANDS.sh) - Quick command reference

## Overview

NeonHub includes isolated Python environments for AI/ML operations, benchmarking, data analysis, and testing. This ensures consistent, reproducible Python dependencies across development, testing, and production.

## Environment Types

### Production Environment
- **Purpose**: Production workloads, benchmarking, and deployed scripts
- **Python Version**: 3.11
- **venv Name**: `.venv/prod`
- **Conda Name**: `neonhub-prod`
- **Dependencies**: Core AI/ML, data science, and production tools

### Test Environment
- **Purpose**: Development, testing, and quality assurance
- **Python Version**: 3.11
- **venv Name**: `.venv/test`
- **Conda Name**: `neonhub-test`
- **Dependencies**: All production deps + testing, security, and dev tools

## Package Managers

### venv (Recommended)
- ✅ Built into Python
- ✅ Lightweight and fast
- ✅ Easy to integrate with CI/CD
- ✅ No external dependencies

### conda
- ✅ Better for data science workflows
- ✅ Handles non-Python dependencies
- ✅ Popular in ML/AI community
- ⚠️ Requires conda installation

## Installation

### First Time Setup
```bash
# Setup all environments (venv + conda if available)
./scripts/python/setup-all.sh

# Or setup individually
./scripts/python/setup-venv.sh prod
./scripts/python/setup-venv.sh test
./scripts/python/setup-conda.sh prod
./scripts/python/setup-conda.sh test
```

## Usage Examples

### Running Benchmarks
```bash
# Activate production environment
source .venv/activate-prod.sh

# Run benchmark script
python scripts/benchmarking/generate-v32-report.py

# Deactivate when done
deactivate
```

### Running Tests
```bash
# Activate test environment
source .venv/activate-test.sh

# Run all tests
pytest

# Run with coverage
pytest --cov --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v

# Deactivate
deactivate
```

### Code Quality Checks
```bash
# Activate test environment (has quality tools)
source .venv/activate-test.sh

# Format code
black .

# Lint
flake8 .
ruff check .

# Type check
mypy .

# Security scan
bandit -r scripts/
safety check

# Run everything
black . && flake8 . && mypy . && pytest --cov
```

### Interactive Development
```bash
# Activate test environment (has Jupyter)
source .venv/activate-test.sh

# Start Jupyter
jupyter notebook

# Or use IPython
ipython
```

## Key Dependencies

### AI/ML
- `openai` - OpenAI API client
- `anthropic` - Claude/Anthropic API client
- `torch` - PyTorch deep learning
- `transformers` - Hugging Face transformers
- `scikit-learn` - Machine learning algorithms

### Data Science
- `pandas` - Data manipulation
- `numpy` - Numerical computing
- `scipy` - Scientific computing
- `matplotlib` - Plotting
- `seaborn` - Statistical visualization
- `plotly` - Interactive plots

### Reporting
- `reportlab` - PDF generation
- `openpyxl` - Excel files
- `jinja2` - Template rendering

### Testing (Test Env)
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `pytest-asyncio` - Async test support
- `pytest-xdist` - Parallel testing
- `pytest-benchmark` - Performance testing
- `faker` - Test data generation
- `hypothesis` - Property-based testing

### Code Quality (Test Env)
- `black` - Code formatting
- `flake8` - Style checking
- `mypy` - Type checking
- `pylint` - Advanced linting
- `ruff` - Fast linting
- `bandit` - Security scanning
- `safety` - Dependency vulnerability scanning

## Configuration Files

### requirements.txt
Production dependencies with pinned versions.

### requirements-test.txt
Test dependencies (includes production requirements).

### environment.yml
Conda production environment specification.

### environment-test.yml
Conda test environment specification.

### pyproject.toml
Python project configuration including:
- Black code formatting settings
- Pytest configuration
- Coverage settings
- Mypy type checking config
- Ruff linter configuration

### pytest.ini
Pytest-specific settings:
- Test discovery patterns
- Output formatting
- Coverage options
- Test markers

### .python-version
Python version specification (3.11).

## CI/CD Integration

### GitHub Actions
```yaml
- name: Set up Python
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'
    cache: 'pip'

- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r python/requirements-test.txt

- name: Run tests
  run: pytest --cov --cov-report=xml
```

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "scripts/benchmarking/generate-v32-report.py"]
```

## Troubleshooting

### Problem: Environment not activating
```bash
# Make sure scripts are executable
chmod +x scripts/python/*.sh

# Try manual activation
source .venv/prod/bin/activate
```

### Problem: Package import errors
```bash
# Verify environment is active
which python
python --version

# Check installed packages
pip list | grep <package>

# Reinstall
pip install --force-reinstall <package>
```

### Problem: Version conflicts
```bash
# Remove and recreate environment
rm -rf .venv/prod
./scripts/python/setup-venv.sh prod
```

### Problem: Conda environment exists
```bash
# Remove existing environment
conda env remove -n neonhub-prod

# Recreate
./scripts/python/setup-conda.sh prod
```

## Maintenance

### Update All Dependencies
```bash
# venv
source .venv/prod/bin/activate
pip install --upgrade -r python/requirements.txt

# conda
conda env update -f python/environment.yml --prune
```

### Check for Outdated Packages
```bash
pip list --outdated
```

### Security Audit
```bash
source .venv/test/bin/activate
safety check
bandit -r scripts/
```

### Clean Up Old Environments
```bash
# Remove venv
rm -rf .venv/

# Remove conda environments
conda env remove -n neonhub-prod
conda env remove -n neonhub-test
```

## Best Practices

1. ✅ **Always activate before running Python scripts**
2. ✅ **Use production env for benchmarks/production**
3. ✅ **Use test env for development/testing**
4. ✅ **Pin dependency versions in requirements files**
5. ✅ **Run tests before committing Python changes**
6. ✅ **Keep Python and pip updated**
7. ✅ **Run security scans regularly**
8. ✅ **Document new dependencies**

## Scripts Directory

### scripts/python/
- `setup-all.sh` - Master setup script (all environments)
- `setup-venv.sh` - venv setup (prod or test)
- `setup-conda.sh` - conda setup (prod or test)
- `test-python-env.sh` - Environment validation

### scripts/benchmarking/
- `generate-v32-report.py` - Performance benchmark generator

## Related Documentation

- [PYTHON_SETUP.md](../PYTHON_SETUP.md) - Setup guide
- [python/README.md](../python/README.md) - Technical details
- [ACTIVATION_COMMANDS.sh](../ACTIVATION_COMMANDS.sh) - Quick reference
- [Main README](../README.md) - Project overview

## Support

For issues or questions:
1. Check [PYTHON_SETUP.md](../PYTHON_SETUP.md) troubleshooting
2. Review [python/README.md](../python/README.md)
3. Check existing issues in the repository
4. Create a new issue with environment details

---

**NeonHub Development Team**  
*Production-grade AI automation with reproducible Python environments*

