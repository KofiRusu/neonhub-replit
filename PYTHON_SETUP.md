# 🐍 NeonHub Python Environment Setup Guide

## Overview

NeonHub now includes dedicated Python virtual environments for AI/ML operations, benchmarking, and data analysis. This system provides isolated, reproducible Python environments for both testing and production.

## 🎯 Features

- ✅ **Dual Environment Support**: Separate `prod` and `test` environments
- ✅ **Multiple Package Managers**: Both `venv` and `conda` supported
- ✅ **Comprehensive Dependencies**: AI/ML, data science, visualization, and testing tools
- ✅ **Automated Setup**: One-command installation and configuration
- ✅ **Environment Testing**: Built-in validation scripts
- ✅ **Git-Safe**: All environments excluded from version control
- ✅ **CI/CD Ready**: GitHub Actions compatible

## 📦 What's Included

### Core Technologies
- **Python**: 3.11 (recommended) or 3.10+
- **Data Science**: pandas, numpy, scipy
- **Machine Learning**: scikit-learn, PyTorch, transformers
- **AI APIs**: OpenAI, Anthropic (Claude)
- **Visualization**: matplotlib, seaborn, plotly, reportlab
- **Databases**: PostgreSQL, Redis, SQLAlchemy
- **Testing**: pytest, pytest-cov, pytest-asyncio
- **Code Quality**: black, flake8, mypy, pylint, ruff

### Test Environment Extras
- Advanced testing tools (pytest-xdist, pytest-benchmark)
- Security scanning (bandit, safety)
- Data generation (faker, hypothesis)
- Documentation (Sphinx)
- Interactive development (Jupyter, IPython)

## 🚀 Quick Setup

### Option 1: Setup Everything (Recommended)

```bash
./scripts/python/setup-all.sh
```

This will:
1. Create venv production environment
2. Create venv test environment
3. Create conda environments (if conda is installed)
4. Test all environments

### Option 2: Individual Setup

**venv Production:**
```bash
./scripts/python/setup-venv.sh prod
```

**venv Test:**
```bash
./scripts/python/setup-venv.sh test
```

**conda Production:**
```bash
./scripts/python/setup-conda.sh prod
```

**conda Test:**
```bash
./scripts/python/setup-conda.sh test
```

## 🔧 Usage

### Activating Environments

**venv Production:**
```bash
source .venv/activate-prod.sh
```

**venv Test:**
```bash
source .venv/activate-test.sh
```

**conda Production:**
```bash
conda activate neonhub-prod
```

**conda Test:**
```bash
conda activate neonhub-test
```

### Deactivating

**venv:**
```bash
deactivate
```

**conda:**
```bash
conda deactivate
```

### Running Scripts

**Benchmark Report:**
```bash
# Activate environment
source .venv/activate-prod.sh

# Run benchmark
python scripts/benchmarking/generate-v32-report.py
```

**Run Tests:**
```bash
# Activate test environment
source .venv/activate-test.sh

# Run all tests
pytest

# Run with coverage
pytest --cov --cov-report=html

# Run specific tests
pytest tests/test_example.py -v
```

## 🧪 Testing Your Setup

```bash
# Test venv production
./scripts/python/test-python-env.sh venv prod

# Test venv test
./scripts/python/test-python-env.sh venv test

# Test conda production
./scripts/python/test-python-env.sh conda prod

# Test conda test
./scripts/python/test-python-env.sh conda test
```

## 📁 Directory Structure

```
NeonHub/
├── python/                          # Python configuration directory
│   ├── requirements.txt             # Production dependencies
│   ├── requirements-test.txt        # Test dependencies
│   ├── environment.yml              # Conda prod config
│   ├── environment-test.yml         # Conda test config
│   ├── pytest.ini                   # Pytest configuration
│   ├── pyproject.toml               # Python project config
│   ├── .python-version              # Python version file
│   └── README.md                    # Detailed documentation
│
├── scripts/python/                  # Python setup scripts
│   ├── setup-all.sh                 # Master setup script
│   ├── setup-venv.sh                # venv setup
│   ├── setup-conda.sh               # conda setup
│   └── test-python-env.sh           # Environment testing
│
├── .venv/                           # venv environments (gitignored)
│   ├── prod/                        # Production venv
│   ├── test/                        # Test venv
│   ├── activate-prod.sh             # Quick activation helper
│   └── activate-test.sh             # Quick activation helper
│
└── scripts/benchmarking/            # Python scripts
    └── generate-v32-report.py       # Benchmark generator
```

## 🔄 Updating Dependencies

### Add New Package

1. **Edit requirements file:**
   ```bash
   echo "new-package==1.0.0" >> python/requirements.txt
   ```

2. **Install in active environment:**
   ```bash
   # venv
   source .venv/prod/bin/activate
   pip install new-package==1.0.0
   
   # conda
   conda activate neonhub-prod
   conda install new-package=1.0.0
   # or
   pip install new-package==1.0.0
   ```

3. **Test:**
   ```bash
   ./scripts/python/test-python-env.sh venv prod
   ```

### Update All Dependencies

**venv:**
```bash
source .venv/prod/bin/activate
pip install --upgrade -r python/requirements.txt
```

**conda:**
```bash
conda env update -f python/environment.yml --prune
```

### Recreate Environment

**venv:**
```bash
rm -rf .venv/prod
./scripts/python/setup-venv.sh prod
```

**conda:**
```bash
conda env remove -n neonhub-prod
./scripts/python/setup-conda.sh prod
```

## 🐛 Troubleshooting

### Problem: Python version not found

**Solution:**
```bash
# macOS
brew install python@3.11

# Ubuntu/Debian
sudo apt-get install python3.11 python3.11-venv

# Update alternatives (Ubuntu/Debian)
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

### Problem: conda not found

**Solution:**
```bash
# macOS
brew install --cask miniconda

# Or download from:
# https://docs.conda.io/en/latest/miniconda.html
```

### Problem: Permission denied on scripts

**Solution:**
```bash
chmod +x scripts/python/*.sh
```

### Problem: pip packages not installing

**Solution:**
```bash
# Upgrade pip
pip install --upgrade pip setuptools wheel

# Clear cache
pip cache purge

# Reinstall
pip install --force-reinstall -r python/requirements.txt
```

### Problem: Import errors after installation

**Solution:**
```bash
# Verify environment is activated
which python
python --version

# Check installed packages
pip list

# Reinstall package
pip install --force-reinstall <package-name>
```

## 🔐 Security

### Scanning for Vulnerabilities

```bash
# Activate test environment (has security tools)
source .venv/activate-test.sh

# Check for known vulnerabilities
safety check

# Run security linter
bandit -r scripts/
```

### Best Practices

1. ✅ Always use virtual environments (never system Python)
2. ✅ Pin package versions in requirements files
3. ✅ Regularly update dependencies (`pip list --outdated`)
4. ✅ Run security scans before deployment
5. ✅ Keep Python version up-to-date
6. ✅ Never commit `.venv/` or conda environments

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Python Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
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
      run: |
        pytest --cov --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## 🎨 Code Quality

### Formatting

```bash
# Format all Python files
black .

# Check without modifying
black --check .
```

### Linting

```bash
# Flake8
flake8 scripts/

# Pylint
pylint scripts/

# Ruff (fast)
ruff check .
```

### Type Checking

```bash
# mypy
mypy scripts/
```

### All Quality Checks

```bash
# Activate test environment
source .venv/activate-test.sh

# Run all checks
black --check . && \
flake8 . && \
mypy . && \
pytest --cov
```

## 📚 Resources

- [Python venv Documentation](https://docs.python.org/3/library/venv.html)
- [Conda User Guide](https://docs.conda.io/projects/conda/en/latest/user-guide/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Black Code Formatter](https://black.readthedocs.io/)
- [NeonHub Python README](python/README.md)

## 🤝 Contributing

When adding Python code:

1. ✅ Use the test environment for development
2. ✅ Follow Black formatting (100 char line length)
3. ✅ Add tests for new functionality
4. ✅ Run full test suite before committing
5. ✅ Update requirements files if adding dependencies
6. ✅ Document new scripts and functions
7. ✅ Run type checking with mypy

## 📝 Version History

- **v3.2.0** (2025-10-22): Initial Python environment setup
  - Added venv and conda support
  - Created production and test environments
  - Integrated AI/ML dependencies
  - Added automated setup scripts
  - Configured pytest and code quality tools

---

**Questions or Issues?**  
Check `python/README.md` for detailed documentation or create an issue in the repository.

**NeonHub Development Team**  
*Building the future of AI automation*

