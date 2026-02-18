# Stripe Setup Guide for OpsDecq Platform

This document outlines the steps to set up Stripe for the OpsDecq platform, including creating a sandbox environment, obtaining necessary credentials, and configuring webhooks.

## 1. Create a Stripe Account & Sandbox

1.  **Sign Up/Login**: Go to [Stripe Dashboard](https://dashboard.stripe.com/) and sign up or log in.
2.  **Create a New Account (Optional)**: If you want to keep this project separate, create a new account from the top-left dropdown menu.
3.  **Enable Test Mode**: 
    -   Locate the "Test mode" toggle in the top-right corner of the dashboard.
    -   **Switch it ON**. All configuration below should be done in Test Mode to ensure you are working in the sandbox environment.

## 2. Obtain API Credentials

You need the **Publishable Key** and **Secret Key** to allow the application to authenticate with Stripe.

1.  Navigate to **Developers** > **API keys** in the left sidebar.
2.  Locate the **Standard keys** section.
3.  Copy the **Publishable key** (starts with `pk_test_...`).
4.  Reveal and copy the **Secret key** (starts with `sk_test_...`).

## 3. Configure Environment Variables

Update your `.env` file (based on `.env.example`) with the credentials obtained.

```env
# Stripe Configuration
STRIPE_PUB_KEY=pk_test_...          # From API Keys > Publishable key
STRIPE_SECRET_KEY=sk_test_...       # From API Keys > Secret key

# URLs for Redirects (Adjust for production)
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/failed
```

## 4. Setup Webhooks

Webhooks are critical for handling asynchronous events like successful payments and subscription updates.

1.  Navigate to **Developers** > **Webhooks**.
2.  Click **Add endpoint**.
3.  **Endpoint URL**: 
    -   For local development, you need a forwarding service like **Stripe CLI** (see Section 5).
    -   For production/staging, enter your domain URL:  
        `https://<your-domain>/api/stripe/webhook`
4.  **Select events to listen to**:
    Click "Select events" and add the following permissions:
    
    -   `checkout.session.completed`
    -   `customer.subscription.created`
    -   `customer.subscription.updated`
    -   `customer.subscription.deleted`
    -   `invoice.payment_succeeded`
    -   `invoice.payment_failed`

5.  Click **Add endpoint**.
6.  **Get Webhook Secret**:
    -   Once created, reveal the **Signing secret** (starts with `whsec_...`) at the top right of the webhook details page.
    -   Add this to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 5. Local Development (Stripe CLI)

To test webhooks locally, you must use the Stripe CLI to forward events to your localhost.

1.  **Install Stripe CLI**: Follow instructions at [Stripe CLI Docs](https://stripe.com/docs/stripe-cli).
2.  **Login**:
    ```bash
    stripe login
    ```
3.  **Listen for events**:
    Forward events to your local API route.
    ```bash
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    ```
4.  **Get Local Webhook Secret**:
    -   The CLI will output a webhook secret (starts with `whsec_...`) specifically for this session.
    -   Use *this* secret in your local `.env` file as `STRIPE_WEBHOOK_SECRET` while testing locally.

## 6. Verification

To verify the setup:

1.  Start your application (`npm run dev`).
2.  Ensure Stripe CLI is running and forwarding events.
3.  Go to the application Sign Up page.
4.  Complete a registration and proceed to payment.
5.  Use Stripe Test Cards (e.g., `4242 4242 4242 4242`) to complete the purchase.
6.  Check the Stripe CLI output; you should see `200` responses for the forwarded events.
7.  Verify in the database (or app UI) that the organization status is updated to `active`.
