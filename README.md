# ENGAGEDLOOP

A Chrome Extension that helps you reply smarter on X (Twitter) when you don't know what to say — and get noticed.

## 🗂️ Project Structure

```
engagedloop/
├── extension/          # Chrome Extension (for Web Store)
│   ├── manifest.json
│   ├── content-brutalist.js
│   ├── popup-brutalist.html
│   ├── popup-brutalist.js
│   └── icons/
├── web/               # Landing Page (for Vercel)
│   ├── index.html
│   ├── privacy-policy.html
│   └── app/           # Next.js + Supabase
└── docs/              # Documentation
    ├── CHROME_STORE_SUBMISSION.md
    └── SUPABASE_API_README.md
```

## 🚀 Quick Start

### Chrome Extension (Local Development)
```bash
cd extension
# Load in Chrome: chrome://extensions/ → Developer mode → Load unpacked
```

### Web Version (Local)
```bash
cd web
npm install
npm run dev
```

## ✨ Features

### Chrome Extension
✅ **Reply Assist** - Generate 3 natural, human-like replies to any tweet  
✅ **Paste Mode** - Paste any tweet text and get reply suggestions  
✅ **Post Mode** - Generate founder-style X posts from your ideas  
✅ **Engagement Mode** - Higher response chance replies  
✅ **Personal Style** - Customize AI to match your writing style  
✅ **Supabase Sync** - Auth, usage limits, cross-device sync  
✅ **Daily Limits** - 3 free/day, 30 pro/day (enforced via Supabase)

### Web Version
✅ **Landing Page** - Brutalist design with waitlist  
✅ **Authentication** - Email/password via Supabase  
✅ **Profile Management** - Writing style, subscription tier  
✅ **Privacy Policy** - Chrome Web Store compliant

## 🛠️ Tech Stack

- **Chrome Extension**: Manifest V3, vanilla JS, Shadow DOM
- **Web**: Next.js, Supabase, brutalist CSS
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **AI**: Gemini API via OpenRouter
- **Deployment**: Vercel (web), Chrome Web Store (extension)

## 📦 Chrome Web Store Submission

See `extension/README.md` for detailed submission steps.

Quick zip command:
```bash
cd extension
zip -r engagedloop-extension.zip .
```

## 🌐 Web Deployment

See `web/README.md` for Vercel deployment steps.

## 🔐 Supabase Integration

- **Project**: `ioyqxwmgfdqzokwqpgdv`
- **Tables**: `profiles`, `usage_logs`, `waitlist`
- **Auth**: Cross-device session sync via cookies
- **Limits**: Enforced at database level (3/30 per day)

## 💰 Pricing

- **Free**: 3 replies/day, basic features
- **Pro**: 30 replies/day, all features, priority support
- **Price**: ₹99 early access, ₹199-299/month planned

## 📧 Support

- Email: engagedloop@gmail.com
- GitHub: https://github.com/SaaSbuilder-maker/Engagedloop
- Website: https://engagedloop.vercel.app

---

Built with 🔥 by ENGAGEDLOOP
