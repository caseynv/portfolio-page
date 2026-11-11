# Private portfolio analytics

## What is implemented
- Opt-in anonymous tracking across Home, Work, Lab, About, and case studies.
- Tracks page views, resume clicks, contact clicks and LinkedIn profile clicks.
- Random per-tab session UUID, HMAC-hashed server-side before persistence. No raw IP, cookies, cross-site IDs or fingerprinting.
- Private `/analytics-admin.html` dashboard. The HTML page is publicly reachable, but its metrics and journeys require a strong server-side token.
- High-interest alerts **only** when a consenting session clicks Resume or Contact. At most one notification attempt per session.
- Dedicated database with RLS on all analytics tables and no grants for public roles.
- Daily 30-day retention cleanup function.

## Required setup before publishing
1. Create a **dedicated** Supabase project, not the Traveler application's project. Apply `supabase/portfolio_analytics.sql` to its SQL editor.
2. Configure these Netlify **server-only** environment variables (never prefix them with `PUBLIC_` or commit their values):
   - `ANALYTICS_SUPABASE_URL` — dedicated project URL
   - `ANALYTICS_SUPABASE_SERVICE_ROLE_KEY` — server-only database service role credential
   - `ANALYTICS_HMAC_KEY` — cryptographically random 32+ byte value
   - `ANALYTICS_ADMIN_TOKEN` — independent cryptographically random 32+ character secret
   - `RESEND_API_KEY` — Resend API key
   - `ANALYTICS_NOTIFY_EMAIL` — recipient address for high-interest email alerts
   - `ANALYTICS_FROM_EMAIL` — verified sending address/domain with Resend
3. Set Netlify's base/build configuration so `netlify/functions` is deployed as functions alongside the static HTML site. No JS build is required.
4. Deploy to a preview environment first. Visit a portfolio page, deny consent and confirm there are no analytics POSTs. Allow consent and confirm one `page_view`; navigate and click resume or contact. Check a single database session and a single email.
5. Test incorrect admin tokens receive HTTP 401, test valid token, test rate-limits, and inspect Netlify logs for errors.
6. Verify scheduled retention cleanup executes on the chosen Netlify plan; use a Supabase scheduled job instead if it does not.

## Privacy / operational notes
- This is *consent-based* event tracking; users who decline are not tracked. Respect DNT and Global Privacy Control. Current banner choice is stored in localStorage; users can revoke by clearing that site's storage. A dedicated privacy settings UI is a sensible future enhancement.
- Analytics only sees click events on the portfolio; it cannot confirm that a PDF was downloaded or that an email was actually sent.
- The admin page must never embed an access token. Enter the token on access; it is held in memory only and not persisted. For stronger production authentication, restrict the page behind Netlify/Cloudflare Access with MFA.
- Journey metrics are limited to the latest 1,000 events; the dashboard is not a complete historical analytics warehouse. Reload manually to see new activity.
- Notifications are attempted at most once per session. An external email provider error is logged, not retried automatically; consider an outbox table and background retry worker for delivery guarantees.
- Browser-level blocking and bots mean totals are not exact. Do not infer visitor identity or recruiter status.
- Configure Netlify WAF/rate-limits and log scrubbing to avoid retention of request IPs or auth headers in external request logs.
- **Deployment is not activated by this PR.** It requires separate Supabase, email configuration, and verification of actual Netlify site-to-repository mapping.
