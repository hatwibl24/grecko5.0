
# Grecko - Production Deployment Guide

This project is a Student Companion App built with React, Supabase, and Gemini AI.
Follow these steps immediately after downloading the project to finalize the Payments and AI features.

## Prerequisites
1.  **Node.js** installed on your computer.
2.  **Supabase CLI** installed (`npm install -g supabase`).
3.  A **Supabase Project** (you already have this: `uopitdnufrnxkhhhdtxk`).

---

## Step 1: Install Dependencies
Open your terminal in the project folder and run:

```bash
npm install
```

## Step 2: Login to Supabase
Link your local environment to your Supabase account.

```bash
npx supabase login
```

## Step 3: Configure AI (Gemini)
To make the AI Mentor, Quiz Generator, and Flashcards work, you must set your API key and deploy the backend function.

1.  **Set the API Key:**
    Replace `[YOUR_GEMINI_KEY]` with your actual key (starts with `AIza...`).
    ```bash
    npx supabase secrets set GEMINI_API_KEY=[YOUR_GEMINI_KEY] --project-ref uopitdnufrnxkhhhdtxk
    ```

2.  **Deploy the AI Function:**
    ```bash
    npx supabase functions deploy ai-assistant --project-ref uopitdnufrnxkhhhdtxk --no-verify-jwt
    ```

## Step 4: Configure Payments (PayPal)
To make the "Buy Course" button work securely.

1.  **Set the Secrets:**
    You need your PayPal Secret from the PayPal Developer Dashboard.
    
    ```bash
    npx supabase secrets set PAYPAL_CLIENT_ID=ATNc9BiWfYBCaZkYVeQSvA0vUMEk-0GHzeEO8mRsS0zOQV17hyoVqJDC2FHvfwOrliy6VHR8djR2kfYt --project-ref uopitdnufrnxkhhhdtxk
    
    npx supabase secrets set PAYPAL_CLIENT_SECRET=[YOUR_PAYPAL_SECRET] --project-ref uopitdnufrnxkhhhdtxk
    
    npx supabase secrets set DATABASE_URL=https://uopitdnufrnxkhhhdtxk.supabase.co --project-ref uopitdnufrnxkhhhdtxk
    
    npx supabase secrets set DATABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY] --project-ref uopitdnufrnxkhhhdtxk
    ```
    *(Note: Find your Service Role Key in Supabase Dashboard > Settings > API).*

2.  **Deploy the Payment Function:**
    ```bash
    npx supabase functions deploy verify-payment --project-ref uopitdnufrnxkhhhdtxk --no-verify-jwt
    ```

## Step 5: Run the App
Now you can start the local development server.

```bash
npm run dev
```

---

## Troubleshooting

**"Deno not found" error during deploy:**
If the deploy command complains about Deno, you may need to install Deno:
- **Mac:** `brew install deno`
- **Windows:** `irm https://deno.land/install.ps1 | iex`

**AI not responding:**
Check the logs in Supabase Dashboard > Edge Functions > ai-assistant > Logs. It will tell you if the API key is invalid.

**Payment Failed:**
Ensure you have run the SQL script provided in the "supabase_setup.sql" file to create the necessary tables and policies.
    