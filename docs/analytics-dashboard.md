# Analytics Dashboard Setup

Use this guide to provision the SEO + content performance dashboard in Looker Studio so the team can monitor traffic, engagement, and keyword performance in one place.

## Prerequisites
- Google Analytics 4 property with stream connected to the NeonHub web app.
- Google Search Console property verified for the production domain (see `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`).
- Backend metrics service available at `/metrics/summary` (requires authenticated session).
- Service account or shared user with read access to GA4 and Search Console.

## Steps
1. **Copy the template**
   - Open `reports/templates/neonhub-seo-template` in Looker Studio.
   - Click *Use my own data*.

2. **Connect data sources**
   - GA4: choose the NeonHub property and the `page_view` events table.
   - Search Console: select the _URL Impression_ table for the verified domain.
   - Backend metrics: create a `JSON/URL` data source that points to `<SITE_URL>/api/backend/metrics/summary?range=30d` (use a service account token or session cookie when prompted).

3. **Set report filters**
   - Default date range: last 30 days.
   - Device breakdown: Desktop, Mobile, Tablet.
   - Content category filter: map to editorial personas (import the Persona dimension from the backend feed).

4. **Calculated fields**
   - `CTR` = Clicks / Impressions (from Search Console).
   - `Engagement Rate` = Engaged Sessions / Sessions (from GA4).
   - `Content Velocity` = Drafts Created (backend) / Weeks in range.

5. **Publish & share**
   - Rename the report `NeonHub SEO Performance`.
   - Share with the marketing workspace and add the data team as editors.
   - Enable scheduled email delivery every Monday 09:00 CET to the content lead distribution list.

## Maintenance
- Update GA4 measurement IDs and Search Console site verification in `.env.local` when cloning to new environments.
- Refresh backend credentials if HTTP 401 errors appear in the JSON data source.
- Document significant dashboard changes in `reports/CHANGELOG.md`.

Following these steps ensures the analytics loop stays connected to the new keyword and editorial workflow.
