# ENGAGEDLOOP Supabase Backend - API Documentation

## 🗄️ Database Schema

### Tables Created

| Table | Purpose | RLS Status |
|-------|---------|------------|
| `profiles` | User data, subscription, writing style | ✅ Enabled |
| `usage_logs` | Track daily AI usage | ✅ Enabled |
| `waitlist` | Marketing email collection | ✅ Enabled |

---

## 📋 Table Details

### 1. `profiles`

**Columns:**
- `id` (uuid) - Primary key, references auth.users
- `email` (text) - User's email
- `is_pro` (boolean) - Subscription status (default: false)
- `stripe_customer_id` (text) - Stripe customer ID for payments
- `writing_style_samples` (text) - User's past tweets for style mimicry
- `preferred_tone` (text) - Options: 'casual', 'professional', 'witty', 'minimalist'
- `created_at` (timestamptz) - Account creation time
- `updated_at` (timestamptz) - Last update time

**RLS Policies:**
- Users can only SELECT/UPDATE their own row
- Auto-created on signup via trigger

### 2. `usage_logs`

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (uuid) - References profiles.id
- `action_type` (text) - 'reply_gen' or 'post_gen'
- `created_at` (timestamptz) - When action occurred

**RLS Policies:**
- Users can only view their own logs
- Users can insert (enforced by trigger with daily limits)

**Limits:**
- Free users: 3 generations per 24 hours
- Pro users: 30 generations per 24 hours

### 3. `waitlist`

**Columns:**
- `id` (uuid) - Primary key
- `email` (text) - Unique email
- `source` (text) - 'landing_page', 'extension_referral', 'social_media'
- `created_at` (timestamptz)

---

## 🔧 Database Functions

### `check_daily_limit(user_id UUID)` → BOOLEAN
Returns TRUE if user is within their daily limit, FALSE if exceeded.

### `get_daily_usage(user_id UUID)` → INTEGER
Returns count of actions in last 24 hours.

### `get_user_limit(user_id UUID)` → INTEGER
Returns user's daily limit (3 or 30).

---

## 🚀 Chrome Extension Integration

### 1. Authentication Flow

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ioyqxwmgfdqzokwqpgdv.supabase.co',
  'sb_publishable_XCn2apCq33VxNF8yXv82MA_L9Pg9ntG'
)

// Check current session
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  // User is logged in, fetch their data
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, writing_style_samples, preferred_tone')
    .single()
  
  // Use profile data for AI generation
}
```

### 2. Detect Session from Web Version

**Background Script:**
```javascript
// content-brutalist.js or background script
chrome.cookies.get({
  url: 'https://engagedloop.vercel.app',
  name: 'sb-ioyqxwmgfdqzokwqpgdv-auth-token'
}, (cookie) => {
  if (cookie) {
    // User is logged in on web, session exists
    // Parse JWT from cookie value
    const session = JSON.parse(decodeURIComponent(cookie.value))
    // Use session.access_token for API calls
  }
})
```

### 3. Check Usage Before Generation

```javascript
// Before calling Gemini API
async function canGenerate(userId) {
  const { data, error } = await supabase
    .rpc('check_daily_limit', { p_user_id: userId })
  
  if (error) {
    console.error('Usage check failed:', error)
    return false
  }
  
  return data // true/false
}

// Log usage after generation
async function logUsage(userId, actionType) {
  const { error } = await supabase
    .from('usage_logs')
    .insert({ user_id: userId, action_type: actionType })
  
  if (error && error.message.includes('DAILY_LIMIT_REACHED')) {
    // Show limit reached message to user
    return false
  }
  
  return true
}
```

### 4. Fetch Writing Style for AI Prompt

```javascript
async function getWritingStyle(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('writing_style_samples, preferred_tone')
    .eq('id', userId)
    .single()
  
  if (profile?.writing_style_samples) {
    // Inject into system prompt
    return {
      samples: profile.writing_style_samples,
      tone: profile.preferred_tone
    }
  }
  
  // Fallback to default
  return null
}
```

### 5. Update Writing Style

```javascript
async function saveWritingStyle(userId, samples, tone) {
  const { error } = await supabase
    .from('profiles')
    .update({
      writing_style_samples: samples,
      preferred_tone: tone,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  return !error
}
```

---

## 💳 Stripe Integration

### Webhook Handler (Edge Function)

Create this in Supabase Dashboard → Edge Functions:

```javascript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16'
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    )
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const customerId = session.customer
      
      // Update user to Pro
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('stripe_customer_id', customerId)
      
      if (error) throw error
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})
```

---

## 🎯 Waitlist API (Landing Page)

```javascript
// On your Vercel landing page
async function joinWaitlist(email, source = 'landing_page') {
  const { error } = await supabase
    .from('waitlist')
    .insert({ email, source })
  
  if (error && error.code === '23505') {
    // Duplicate email
    return { success: false, message: 'Already on waitlist' }
  }
  
  return { success: !error }
}
```

---

## 🔐 Environment Variables (Chrome Extension)

```javascript
// .env or manifest.json (for content script)
const SUPABASE_URL = 'https://ioyqxwmgfdqzokwqpgdv.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XCn2apCq33VxNF8yXv82MA_L9Pg9ntG'
```

---

## 📊 Usage Dashboard Query

```sql
-- Get daily usage stats
SELECT 
  p.email,
  p.is_pro,
  COUNT(u.id) as usage_today
FROM profiles p
LEFT JOIN usage_logs u ON p.id = u.user_id 
  AND u.created_at > NOW() - INTERVAL '24 hours'
GROUP BY p.id, p.email, p.is_pro
ORDER BY usage_today DESC;
```

---

## ✅ Backend Status

| Component | Status |
|-----------|--------|
| Database Tables | ✅ Created |
| RLS Policies | ✅ Enabled |
| Auto-profile Creation | ✅ Trigger Active |
| Usage Limit Enforcement | ✅ Trigger Active |
| Functions | ✅ Created |

**Ready for Extension Integration!** 🚀
