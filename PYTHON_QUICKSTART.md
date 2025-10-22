# 🚀 Python Environments - Quick Start

## TL;DR

```bash
# Setup everything (one command)
./scripts/python/setup-all.sh

# Activate production environment
source .venv/activate-prod.sh

# Run a Python script
python scripts/benchmarking/generate-v32-report.py

# Deactivate
deactivate
```

## 📦 What You Get

- ✅ **Production** environment for running scripts
- ✅ **Test** environment for development
- ✅ **venv** support (lightweight, built-in)
- ✅ **conda** support (optional, data science)
- ✅ All AI/ML dependencies (OpenAI, Anthropic, PyTorch, etc.)
- ✅ Testing tools (pytest, coverage)
- ✅ Code quality tools (Black, Flake8, mypy, Ruff)

## 🎯 Common Tasks

### Run Benchmarks
```bash
source .venv/activate-prod.sh
python scripts/benchmarking/generate-v32-report.py
deactivate
```

### Run Tests
```bash
source .venv/activate-test.sh
pytest --cov
deactivate
```

### Format Code
```bash
source .venv/activate-test.sh
black .
deactivate
```

### Interactive Development
```bash
source .venv/activate-test.sh
jupyter notebook  # or ipython
```

## 🔧 Setup Options

### Option 1: All Environments (Recommended)
```bash
./scripts/python/setup-all.sh
```

### Option 2: Individual Setup
```bash
# venv only
./scripts/python/setup-venv.sh prod
./scripts/python/setup-venv.sh test

# conda only (if you have conda installed)
./scripts/python/setup-conda.sh prod
./scripts/python/setup-conda.sh test
```

## ✅ Verify Setup
```bash
./scripts/python/test-python-env.sh venv prod
./scripts/python/test-python-env.sh venv test
```

## 📚 Documentation

- **Full Setup Guide**: [PYTHON_SETUP.md](PYTHON_SETUP.md)
- **Technical Docs**: [python/README.md](python/README.md)
- **Usage Guide**: [docs/PYTHON_ENVIRONMENTS.md](docs/PYTHON_ENVIRONMENTS.md)
- **Summary**: [PYTHON_ENVIRONMENTS_SUMMARY.md](PYTHON_ENVIRONMENTS_SUMMARY.md)

## 🆘 Help

### Problem: Environment won't activate
```bash
chmod +x scripts/python/*.sh
source .venv/prod/bin/activate  # manual activation
```

### Problem: Package not found
```bash
source .venv/prod/bin/activate
pip install <package-name>
```

### Problem: Need to start over
```bash
rm -rf .venv/
./scripts/python/setup-all.sh
```

## 🎓 What's Inside

**Production Environment**:
- pandas, numpy, scipy
- scikit-learn, PyTorch, transformers
- OpenAI, Anthropic APIs
- matplotlib, seaborn, plotly
- pytest, black, flake8, mypy

**Test Environment** (all above +):
- pytest-xdist, pytest-benchmark
- jupyter, ipython
- bandit, safety (security)
- sphinx (docs)
- faker, hypothesis (test data)

---

**Ready to go!** Run `./scripts/python/setup-all.sh` to get started.

