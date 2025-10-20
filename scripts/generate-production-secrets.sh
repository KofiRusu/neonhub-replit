#!/bin/bash
set -euo pipefail

SECRETS_FILE="release/production-secrets-$(date +%Y%m%d-%H%M%S).txt"

echo "Generating production secrets..."
echo "# NeonHub v3.0 Production Secrets" > "$SECRETS_FILE"
echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$SECRETS_FILE"
echo "" >> "$SECRETS_FILE"

echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> "$SECRETS_FILE"
echo "JWT_SECRET=$(openssl rand -hex 32)" >> "$SECRETS_FILE"
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> "$SECRETS_FILE"

chmod 600 "$SECRETS_FILE"

echo "✓ Secrets generated: $SECRETS_FILE"
echo "⚠️  IMPORTANT: Store these in your deployment platform's secret manager"
echo "⚠️  DO NOT commit this file to version control"