# Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js** with support for authentication, Stripe integration for payments, and a dashboard for logged-in users.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events
- **MDX Blog** with automated post submission workflow (`/blog`)

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

Update your `.env` file:

```env
# Existing variables (keep these)
POSTGRES_URL=postgres://postgres:postgres@localhost:54322/postgres
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=http://localhost:3000
RESEND_API_KEY=re_...
AUTH_SECRET=your_auth_secret_here

# Google OAuth (add these)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret

# NextAuth (add these)
NEXTAUTH_SECRET=your_nextauth_secret_here

#N8N
N8N_WEBHOOK_URL=https://automationforms.app.n8n.cloud/webhook/...
N8N_WEBHOOK_KEY=superHardPassword
```


## Blog Feature

This template includes a full-featured MDX blog system with automated submission workflow.

### Quick Start

Create a new blog post:

**Linux/macOS:**
```bash
bash scripts/new-post-linux.sh    # or new-post-macos.sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/new-post-windows.ps1
```

The workflow will:
- Guide you through creating a post (paste content or provide a file path)
- Auto-generate frontmatter with SEO fields
- Normalize image paths and copy images to the post directory
- Create a git branch and push
- Open a GitHub Pull Request with a checklist

### Manual Post Creation

Alternatively, use the simple script:

```bash
pnpm new:post "Your Post Title"
```

This creates a basic post scaffold with draft mode enabled.

### Documentation

- **Blog Usage**: See `docs/blog-post-workflow.md` for complete workflow documentation
- **Development**: Run `pnpm dev:webpack` for full MDX plugin support
- **View Posts**: Visit `http://localhost:3000/blog`

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
