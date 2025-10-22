# NeonHub Python Environment Setup

This directory contains Python environment configurations for the NeonHub project, supporting both `venv` and `conda` package managers.

## 🎯 Overview

NeonHub provides two separate Python environments:
- **Production (`prod`)**: Optimized for deployment and production workloads
- **Testing (`test`)**: Extended with testing, development, and quality assurance tools

## 📋 Requirements

- Python 3.10+ (3.11 recommended)
- For venv: `python3-venv` package
- For conda: Miniconda or Anaconda

## 🚀 Quick Start

### Option 1: Using venv (Recommended for local development)

```bash
# Production environment
./scripts/python/setup-venv.sh prod

# Test environment
./scripts/python/setup-venv.sh test

# Activate
source .venv/activate-prod.sh
# or
source .venv/activate-test.sh
```

### Option 2: Using conda

```bash
# Production environment
./scripts/python/setup-conda.sh prod

# Test environment  
./scripts/python/setup-conda.sh test

# Activate
conda activate neonhub-prod
# or
conda activate neonhub-test
```

## 🧪 Testing Your Environment

```bash
# Test venv production
./scripts/python/test-python-env.sh venv prod

# Test conda test environment
./scripts/python/test-python-env.sh conda test
```

## 📦 Installed Packages

### Core Libraries (Both Environments)
- **Data Science**: pandas, numpy, scipy
- **ML/AI**: scikit-learn, torch, transformers, openai, anthropic
- **Visualization**: matplotlib, seaborn, plotly, reportlab
- **Database**: psycopg2-binary, redis, sqlalchemy
- **Testing**: pytest, pytest-asyncio, pytest-cov
- **Code Quality**: black, flake8, mypy, pylint

### Test Environment Additional Packages
- pytest-xdist (parallel testing)
- pytest-benchmark (performance testing)
- faker, hypothesis (data generation)
- bandit, safety (security scanning)
- sphinx (documentation)
- jupyter, ipython (interactive development)

## 📁 File Structure

```
python/
├── requirements.txt          # Production dependencies
├── requirements-test.txt     # Test dependencies (includes prod)
├── environment.yml           # Conda prod environment
├── environment-test.yml      # Conda test environment
└── README.md                 # This file

.venv/                        # Created by venv setup
├── prod/                     # Production venv
├── test/                     # Test venv
├── activate-prod.sh          # Quick activation helper
└── activate-test.sh          # Quick activation helper

.conda-activate-prod.sh       # Created by conda setup
.conda-activate-test.sh       # Created by conda setup
```

## 🔧 Environment Management

### venv Commands

```bash
# Activate
source .venv/prod/bin/activate

# Deactivate
deactivate

# View info
env-info

# Update packages
pip install --upgrade -r python/requirements.txt
```

### conda Commands

```bash
# Activate
conda activate neonhub-prod

# Deactivate
conda deactivate

# List packages
conda list

# Update environment
conda env update -f python/environment.yml --prune

# Export snapshot
conda env export > environment-snapshot.yml
```

## 🔄 Updating Dependencies

### Add New Package

1. Add to appropriate requirements file:
   ```bash
   echo "new-package==1.0.0" >> python/requirements.txt
   ```

2. Update environment:
   ```bash
   # venv
   source .venv/prod/bin/activate
   pip install new-package==1.0.0
   
   # conda
   conda activate neonhub-prod
   conda install new-package=1.0.0
   ```

3. Test installation:
   ```bash
   ./scripts/python/test-python-env.sh venv prod
   ```

### Update All Packages

```bash
# venv
pip install --upgrade -r python/requirements.txt

# conda
conda env update -f python/environment.yml --prune
```

## 🐛 Troubleshooting

### Issue: "Python 3.10+ required"
**Solution**: Upgrade Python
```bash
# macOS
brew install python@3.11

# Ubuntu/Debian
sudo apt-get install python3.11
```

### Issue: "conda not found"
**Solution**: Install Miniconda
```bash
# macOS
brew install miniconda

# Or download from: https://docs.conda.io/en/latest/miniconda.html
```

### Issue: "Module not found after installation"
**Solution**: Verify environment activation
```bash
# Check which python
which python
python --version

# Reinstall in correct environment
pip install --force-reinstall <package>
```

### Issue: "Permission denied"
**Solution**: Make scripts executable
```bash
chmod +x scripts/python/*.sh
```

## 🎨 Using Python Scripts

### Run Benchmarks

```bash
# Activate environment
source .venv/prod/bin/activate

# Run benchmark
python scripts/benchmarking/generate-v32-report.py
```

### Run Tests

```bash
# Activate test environment
source .venv/test/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_example.py
```

## 🔐 Security Best Practices

1. **Never commit virtual environments** - Already in `.gitignore`
2. **Pin package versions** - Use exact versions in requirements files
3. **Scan for vulnerabilities** (test environment):
   ```bash
   safety check
   bandit -r .
   ```
4. **Keep dependencies updated** - Regular security patches

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Set up Python
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'
    
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r python/requirements-test.txt
    
- name: Run tests
  run: pytest --cov
```

## 📚 Additional Resources

- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [Conda user guide](https://docs.conda.io/projects/conda/en/latest/user-guide/)
- [Python packaging guide](https://packaging.python.org/)

## 🤝 Contributing

When adding new Python dependencies:
1. Test in both venv and conda
2. Update both requirements files and environment.yml
3. Document the purpose of new dependencies
4. Run full test suite: `./scripts/python/test-python-env.sh`

---

**NeonHub Development Team**  
For issues or questions, check the main project README or create an issue.

