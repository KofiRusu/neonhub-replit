# 🧪 Browser Testing Guide: Database Autonomous Deployment

This guide covers testing the real-time migration monitoring dashboard using browser automation.

---

## Prerequisites

### 1. Environment Setup

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Copy environment template
cp ENV_TEMPLATE.example .env

# Configure required variables:
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_URL (http://127.0.0.1:3000)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - OPENAI_API_KEY (optional for testing)
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm run prisma:generate
```

### 3. Database Setup

```bash
cd apps/api

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

---

## Starting the Development Environment

### Terminal 1: Start API Server

```bash
cd /Users/kofirusu/Desktop/NeonHub
pnpm --filter apps/api dev

# Wait for output:
# ✓ NeonHub API server started
# ✓ Port: 3001
# ✓ Environment: development
```

### Terminal 2: Start Web Frontend

```bash
cd /Users/kofirusu/Desktop/NeonHub
pnpm --filter apps/web dev

# Wait for output:
# ✓ Ready in X.Xs
# ✓ Local: http://127.0.0.1:3000
```

---

## Browser Testing Checklist

### 1. Access Deployment Dashboard

Open browser and navigate to:
```
http://localhost:3000/deployment
```

**Expected Result:**
- ✅ Page loads successfully
- ✅ "Deployment Dashboard" heading visible
- ✅ System health cards show "Healthy" status
- ✅ Database status badge shows "ok"
- ✅ WebSocket status badge shows "ok"

### 2. WebSocket Connection Test

**In Browser DevTools Console:**

```javascript
// Test 1: Check WebSocket connection
console.log("Testing WebSocket connection...");

// The useMigrationStatus hook automatically connects
// Check connection status in the UI:
// Look for "Connected" badge (green) in Migration Monitor card

// Test 2: Manually trigger connection test
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  
  // Subscribe to migration updates
  socket.emit('subscribe:migration');
  
  // Listen for status
  socket.on('migration:status', (data) => {
    console.log('📊 Migration status:', data);
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Test 3: Check active connections
socket.on('disconnect', () => {
  console.log('🔌 Disconnected');
});
```

### 3. Real-Time Migration Monitoring

**Terminal 3: Run Migration Test**

```bash
cd /Users/kofirusu/Desktop/NeonHub

# Execute the migration monitor script
npx tsx scripts/cursor-migration-monitor.ts --dry-run
```

**Expected Browser Behavior:**
1. Migration Monitor card updates in real-time
2. Progress bar shows migration phases
3. Each phase shows:
   - ✅ Status badge (pending → running → complete)
   - ⏱️ Duration in seconds
   - 📝 Description
4. Overall status updates to "Completed"

### 4. Test WebSocket Events

**In Browser Console:**

```javascript
// Listen for all migration events
const events = [
  'migration:started',
  'migration:phase:start',
  'migration:phase:complete',
  'migration:phase:failed',
  'migration:completed'
];

events.forEach(event => {
  socket.on(event, (data) => {
    console.log(`📡 ${event}:`, data);
  });
});

// Trigger a test migration (backend endpoint needed)
fetch('http://localhost:3001/api/admin/test-migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(res => res.json()).then(console.log);
```

### 5. Health Check Verification

**API Health Endpoint Test:**

```bash
# Test health endpoint
curl http://localhost:3001/health | jq .

# Expected output:
{
  "status": "healthy",
  "version": "3.2.0",
  "checks": {
    "database": { "status": "ok", "latency": 15 },
    "websocket": { "status": "ok", "connections": 1 },
    "stripe": { "status": "not_configured" },
    "openai": { "status": "ok" }
  },
  "timestamp": "2025-10-26T...",
  "uptime": 123
}
```

**In Browser:**
- Navigate to http://localhost:3000/deployment
- Verify health cards show correct statuses
- Click "Refresh" button - values should update

### 6. Drift Detection Test

**Trigger Manual Drift Check:**

```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api

# Run drift detector
npx tsx src/services/drift-detector.ts

# Expected output:
# ✅ No schema drift detected
# OR
# ⚠️  Schema drift detected: [details]
```

**In Browser:**
- Watch for WebSocket event: `drift:detected`
- Should show alert if drift found

---

## Automated Browser Tests

### Using Playwright

Create: `apps/web/tests/e2e/deployment.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Deployment Dashboard', () => {
  test('should load deployment page', async ({ page }) => {
    await page.goto('http://localhost:3000/deployment');
    await expect(page.locator('h1')).toContainText('Deployment Dashboard');
  });

  test('should show WebSocket connection status', async ({ page }) => {
    await page.goto('http://localhost:3000/deployment');
    
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Check for Connected badge
    const badge = page.locator('text=Connected');
    await expect(badge).toBeVisible();
  });

  test('should display health metrics', async ({ page }) => {
    await page.goto('http://localhost:3000/deployment');
    
    // Check health cards are present
    await expect(page.locator('text=Overall Status')).toBeVisible();
    await expect(page.locator('text=Database')).toBeVisible();
    await expect(page.locator('text=WebSocket')).toBeVisible();
    await expect(page.locator('text=Uptime')).toBeVisible();
  });

  test('should update migration status in real-time', async ({ page }) => {
    await page.goto('http://localhost:3000/deployment');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Trigger a test migration via API
    await page.evaluate(async () => {
      await fetch('http://localhost:3001/api/admin/test-migration', {
        method: 'POST'
      });
    });
    
    // Wait for migration phases to appear
    await page.waitForSelector('text=backup', { timeout: 10000 });
    
    // Check that phases update
    const phaseStatus = page.locator('[data-testid="phase-status"]').first();
    await expect(phaseStatus).toBeVisible();
  });
});
```

**Run Tests:**

```bash
cd apps/web
pnpm test:e2e
```

---

## Performance Testing

### Load Test WebSocket Connections

```bash
# Install artillery
npm install -g artillery

# Create load test config
cat > artillery-ws.yml <<EOF
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
  engines:
    socketio:
      transports: ["websocket"]
scenarios:
  - name: "Migration monitoring"
    engine: socketio
    flow:
      - emit:
          channel: "subscribe:migration"
      - think: 30
      - emit:
          channel: "unsubscribe:migration"
EOF

# Run load test
artillery run artillery-ws.yml
```

**Expected Results:**
- ✅ All connections succeed
- ✅ No connection timeouts
- ✅ Average latency < 100ms
- ✅ No errors in server logs

---

## Troubleshooting

### Issue: "Disconnected" Badge Shows Red

**Solution:**
```bash
# Check API server is running
curl http://localhost:3001/health

# Check browser console for errors
# F12 → Console tab → Look for WebSocket errors

# Check CORS configuration
# In apps/api/src/ws/index.ts, verify:
cors: {
  origin: "http://127.0.0.1:3000",
  methods: ["GET", "POST"]
}
```

### Issue: Migration Events Not Showing

**Solution:**
```bash
# Verify WebSocket subscription
# In browser console:
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);

# Check server logs for subscription
# Should show: "Client subscribed to migration updates"
```

### Issue: Health Checks Fail

**Solution:**
```bash
# Check database connection
cd apps/api
npx prisma db execute --stdin <<< "SELECT 1"

# Restart API server
# Ctrl+C in Terminal 1
pnpm --filter apps/api dev
```

---

## Validation Checklist

Before marking testing complete:

- [ ] ✅ API server starts without errors
- [ ] ✅ Web frontend loads successfully
- [ ] ✅ Deployment dashboard accessible at `/deployment`
- [ ] ✅ WebSocket connection shows "Connected" (green)
- [ ] ✅ Health checks show "ok" status
- [ ] ✅ Database connectivity verified
- [ ] ✅ Migration monitor displays phases
- [ ] ✅ Real-time updates work (tested with script)
- [ ] ✅ Browser console shows no errors
- [ ] ✅ Drift detection runs without errors
- [ ] ✅ All Playwright tests pass (if implemented)

---

## Next Steps

After successful browser testing:

1. **Production Deployment:**
   - Follow `/docs/PRODUCTION_RUNBOOK.md`
   - Deploy to staging environment first
   - Run smoke tests
   - Deploy to production

2. **Monitoring Setup:**
   - Configure Sentry error tracking
   - Set up uptime monitoring
   - Enable drift detection alerts

3. **Documentation:**
   - Update team wiki
   - Record demo video
   - Train team members

---

## Additional Resources

- **Deployment Guide:** `/docs/DATABASE_AUTONOMOUS_DEPLOYMENT_GUIDE.md`
- **Production Runbook:** `/docs/PRODUCTION_RUNBOOK.md`
- **WebSocket Documentation:** `/apps/api/src/ws/index.ts`
- **Migration Service:** `/apps/api/src/services/migration.service.ts`

---

**Happy Testing! 🚀**

