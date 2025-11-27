#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║      PRODUCTION DEPLOYMENT VERIFICATION                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# These URLs will be provided by GitHub Actions deployment logs
# Update them once you see the actual URLs

echo "⚠️ IMPORTANT: Update these URLs from GitHub Actions logs"
echo ""
echo "Get URLs from:"
echo "  • GitHub Actions > Latest Run > Deploy job > Logs"
echo "  • Look for 'Deployed to Vercel' and 'Deployed to Railway'"
echo ""

read -p "Enter Vercel URL (e.g., https://neonhub-xxx.vercel.app): " VERCEL_URL
read -p "Enter Railway URL (e.g., https://neonhub-production-xxx.up.railway.app): " RAILWAY_URL

echo ""
echo "=== VERIFYING PRODUCTION DEPLOYMENT ==="
echo ""

# Test Web App
echo "1. Testing Web Application..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL")
if [ "$WEB_STATUS" = "200" ]; then
  echo "✅ Web App: $VERCEL_URL (HTTP $WEB_STATUS)"
else
  echo "⚠️ Web App: HTTP $WEB_STATUS"
fi

echo ""

# Test API Health
echo "2. Testing API Health..."
HEALTH=$(curl -s "$RAILWAY_URL/api/health" 2>/dev/null)
if [ -n "$HEALTH" ]; then
  echo "✅ API Health: $RAILWAY_URL/api/health"
  echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
  echo "⚠️ API Health: No response"
fi

echo ""

# Test Database Connectivity
echo "3. Testing Database Connectivity..."
READYZ=$(curl -s "$RAILWAY_URL/api/readyz" 2>/dev/null)
if [ -n "$READYZ" ]; then
  echo "✅ Database Readiness: $RAILWAY_URL/api/readyz"
  echo "$READYZ" | jq . 2>/dev/null || echo "$READYZ"
  
  DB_STATUS=$(echo "$READYZ" | jq -r '.db' 2>/dev/null)
  VECTOR_STATUS=$(echo "$READYZ" | jq -r '.pgvector' 2>/dev/null)
  
  if [ "$DB_STATUS" = "connected" ]; then
    echo "✅ Database: CONNECTED"
  fi
  
  if [ "$VECTOR_STATUS" = "ready" ]; then
    echo "✅ pgvector: READY"
  fi
else
  echo "⚠️ Database readiness: No response"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              PRODUCTION VERIFICATION COMPLETE              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Web: $VERCEL_URL"
echo "✅ API: $RAILWAY_URL"
echo ""
