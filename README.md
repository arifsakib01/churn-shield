# Churn Shield

Churn Shield is a Next.js App Router application for recovering failed Stripe invoices.

## Setup

1. Install Node.js 20+ and PostgreSQL (Supabase PostgreSQL works).
2. Copy `.env.example` to `.env` and fill in every value.
3. Install dependencies with `npm install`.
4. Generate the Prisma client and create the database tables:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the application with `npm run dev`.

Configure Stripe to send `invoice.payment_failed` and `invoice.payment_succeeded` events to `/api/webhooks/stripe`. The webhook endpoint verifies Stripe’s signature before doing any work and reserves event IDs to make duplicate deliveries safe.

## Selling Churn Shield

The `/pricing` page and `/api/billing/checkout` route provide Stripe subscription checkout for Starter, Growth, and Scale. Create recurring Stripe Prices, set `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, and `STRIPE_PRICE_SCALE`, then add `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` to your webhook configuration. Never place Stripe secret keys in the browser or repository.

## GitHub Actions

Pull requests and pushes to `main`/`master` run `.github/workflows/ci.yml`. The workflow installs dependencies, generates Prisma, type-checks TypeScript, and builds Next.js with non-secret CI placeholders. Production Stripe, Resend, and database values must be configured in the hosting provider rather than committed to GitHub.

## Security notes

- Card details never reach the application server; Stripe Elements creates the PaymentMethod in the browser.
- Recovery links contain a cryptographically random, 32-byte token and only expose a minimal invoice projection.
- The dashboard currently assumes it is deployed behind your organization’s authentication layer (for example, NextAuth, an identity-aware proxy, or a private network). Add that layer before exposing `/dashboard` publicly.
- Keep `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, and `RESEND_API_KEY` server-only. Only the publishable Stripe key may use the `NEXT_PUBLIC_` prefix.
