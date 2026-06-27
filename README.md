# 📈 TradeGradyzer

An AI-powered **Progressive Web App** that grades trading setups. Upload your **4H, 1H and 30M** charts and Gemini Vision marks the key levels, scores the setup **10–100%**, assigns a **confidence grade (A+ / B / C / F)**, and pinpoints a clean **entry, stop loss and take profit**.

> ⚠️ Educational tool only. Not financial advice.

---

## ✨ Features

- **Multi-timeframe upload** (4H / 1H / 30M) with drag-and-drop.
- **Gemini Vision analysis** via a secure Supabase Edge Function (API key never hits the browser).
- **Setup score** (animated ring) + **confidence grade** badge.
- **Key levels drawn back onto your chart** (support / resistance / entry) using normalized coordinates.
- **Trade plan**: entry, stop loss, take profit, R:R.
- **Auth** (email/password + Google) and per-user **analysis history** (Supabase + RLS).
- **Free tier limit** (3 analyses) with **mocked weekly/monthly subscriptions** (swap in Paystack later).
- **Installable PWA**, glassmorphism UI, Framer Motion animations.

## 🧱 Tech stack

| Layer      | Choice                                  |
| ---------- | --------------------------------------- |
| Frontend   | React 18 + Vite, Tailwind v4, Framer Motion, Zustand |
| Auth + DB  | Supabase (Postgres, RLS, Storage, Auth) |
| AI         | Google Gemini (free tier) via Supabase Edge Function |
| Payments   | Mocked now → Paystack later             |
| PWA        | vite-plugin-pwa (Workbox)               |

---

## 🚀 Getting started

### 1. Install & configure

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
```

You can run the **entire UI with no backend** by setting:

```env
VITE_USE_MOCK_ANALYZER=true
```

(Auth/history still need Supabase, but the analyzer returns realistic mock data.)

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon key** into `.env`.
3. Run the schema: paste `supabase/migrations/0001_init.sql` into the **SQL Editor**, or with the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
   This creates `profiles`, `analyses`, the `charts` storage bucket, RLS policies, and a trigger that auto-creates a profile on signup.
4. (Optional) Enable **Google** provider under Authentication → Providers.

### 3. Deploy the Gemini analyzer

```bash
# Get a free key at https://aistudio.google.com/apikey
supabase secrets set GEMINI_API_KEY=your_key
supabase functions deploy analyze-chart
```

Leave `VITE_USE_MOCK_ANALYZER=false` to use the real function.

### 4. Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview the build
```

---

## 💳 Switching the mock payments to Paystack

Payments are intentionally mocked in **`src/lib/analyses.js → activateSubscriptionMock()`**. The rest of the app only relies on the `profiles.subscription_*` columns being updated, so to go live:

1. Add the Paystack inline script / SDK and initialize a transaction (use plan codes for weekly/monthly).
2. On a successful charge, **verify server-side** (a second Edge Function is recommended) and update the user's `profiles` row exactly like the mock does.
3. Replace the call in `src/pages/Pricing.jsx` with the Paystack flow.

---

## 🗂️ Project structure

```
src/
├─ components/
│  ├─ ui/            # GlassCard, Button, ScoreRing, ConfidenceBadge, Field, Spinner, PageTransition
│  ├─ layout/        # AppLayout (sidebar + mobile nav), AuthShell
│  ├─ ChartUploader.jsx
│  ├─ ChartViewer.jsx   # draws AI levels over the image
│  └─ ProtectedRoute.jsx
├─ pages/            # Landing, Login, Signup, Dashboard, Analyze, AnalysisResult, History, Pricing, Settings
├─ lib/              # supabase, analyzer (Gemini client + mock), analyses (DB/storage), constants
└─ store/            # authStore (Zustand)

supabase/
├─ migrations/0001_init.sql
└─ functions/analyze-chart/index.ts   # Gemini Vision, structured JSON output
```

## 📈 Scalability notes

- **Secrets stay server-side** in the Edge Function — safe to scale horizontally.
- **RLS on every table** so the public anon key is safe in the client.
- **Structured output schema** keeps Gemini responses parseable and cheap.
- **Code-split bundles** (react / motion / supabase vendor chunks) and **PWA precaching** for fast repeat loads.
- Stateless frontend → deploy to any static host / Vercel; Supabase scales the data + functions.
