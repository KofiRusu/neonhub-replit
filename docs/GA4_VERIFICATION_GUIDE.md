# GA4 Real-time Verification Guide

## Quick Setup & Verification

### Step 1: Configure GA4 Measurement ID

1. Add your GA4 Measurement ID to the web app environment:

```bash
# In apps/web/.env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

2. Restart the development server:

```bash
npm run dev --workspace=apps/web
```

### Step 2: Generate Test Traffic

1. Open an **incognito/private browsing window** (to avoid ad blockers and extensions)
2. Navigate to `http://localhost:3000/content`
3. Interact with the page for ~30 seconds:
   - Scroll up and down
   - Click on articles/links
   - Navigate between different content pages
   - Use search if available

### Step 3: Verify in GA4 Dashboard

1. Open [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Navigate to: **Reports → Realtime**
4. Confirm the following:
   - **At least 1 active user** appears
   - **page_view events** are logged
   - **Event count by Event name** shows activity
   - Your page path (`/content`) appears in the list

### Expected Results

✅ **Success indicators:**
- Active users counter increases
- Page views increment
- Event timeline shows real-time activity
- Geographic location appears (if enabled)

❌ **Troubleshooting if no data appears:**

#### 1. Check Measurement ID
```bash
# Verify the ID is set correctly
echo $NEXT_PUBLIC_GA_MEASUREMENT_ID

# Should output: G-XXXXXXXXXX
```

#### 2. Check Browser Console
Open DevTools (F12) and look for:
- GA4 initialization messages
- Network requests to `google-analytics.com/g/collect`
- Any error messages related to gtag or analytics

#### 3. Verify Script Loading
In the page source, confirm the GA4 script is present:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

#### 4. Check Ad Blockers
- Disable browser extensions (use incognito mode)
- Disable VPN/proxy if active
- Try a different browser

#### 5. Wait Period
- GA4 Realtime can take 30-60 seconds to show data
- If still no data after 2 minutes, check configuration

### Advanced Verification: GA4 Debug Mode

For detailed event tracking:

1. Install the [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger)
2. Enable the extension
3. Open your site and check the console for detailed event logs

Or use debug mode in code:

```typescript
// In apps/web/src/lib/analytics.ts
window.gtag('config', 'G-XXXXXXXXXX', {
  debug_mode: true
});
```

### Production Verification

For production deployments:

```bash
# Check live site
curl -s https://yourdomain.com/content | grep -q 'gtag.js' && echo "GA4 ✅" || echo "GA4 ❌"

# Verify measurement ID
curl -s https://yourdomain.com | grep -o 'G-[A-Z0-9]\+'
```

### Key Events to Monitor

The NeonHub implementation tracks:

| Event Name | Description | Trigger |
|------------|-------------|---------|
| `page_view` | Page navigation | Automatic on route change |
| `search` | Search queries | Search form submission |
| `select_content` | Content interaction | Article clicks |
| `view_item` | Item details | Product/service views |

### Useful GA4 Queries

**Check realtime users by page:**
- Reports → Realtime → View by Page title and screen name

**Verify event parameters:**
- Reports → Realtime → Event count by Event name → Click event → View parameters

**Debug missing data:**
- Admin → Data Streams → Select your stream → View tag details → Recently active URLs

## Next Steps

Once verification is complete:
1. Set up custom events for business goals
2. Configure conversion tracking
3. Create custom reports and dashboards
4. Set up alerts for traffic anomalies

## Support

If verification fails after following all steps:
1. Check the [GA4 status page](https://www.google.com/appsstatus/dashboard/)
2. Review [GA4 troubleshooting guide](https://support.google.com/analytics/answer/9333790)
3. Verify property settings in GA4 admin console

