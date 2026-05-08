# ENGAGEDLOOP Web Version

## Vercel Deployment Package

This folder contains the web version of ENGAGEDLOOP for deployment to Vercel.

### 📁 Files Included

| File/Folder | Purpose |
|-------------|---------|
| `index.html` | Landing page with waitlist |
| `privacy-policy.html` | Privacy policy page |
| `icon-generator.html` | Tool for generating icons |
| `app/` | Next.js app router pages |
| `utils/` | Supabase client utilities |
| `middleware.ts` | Next.js middleware for auth |
| `package.json` | Dependencies |
| `next.config.js` | Next.js configuration |
| `.env.local` | Environment variables |
| `vercel.json` | Vercel deployment config |

### 🚀 Deployment Steps

#### Option 1: Vercel CLI

```bash
cd web
npm install
vercel --prod
```

#### Option 2: GitHub + Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add web/
   git commit -m "Add web version"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repo
   - Set root directory to `web/`
   - Deploy

3. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ioyqxwmgfdqzokwqpgdv.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XCn2apCq33VxNF8yXv82MA_L9Pg9ntG
   ```

### 🎯 Features

**Landing Page:**
- Brutalist design matching extension
- Waitlist email collection
- Live user count from Supabase
- Pricing section (Free vs Pro)
- Feature showcase
- Mobile responsive

**Auth Pages:**
- Sign up / Sign in
- User profile management
- Writing style configuration

**Privacy Policy:**
- Compliant with Chrome Web Store requirements
- Data usage transparency

### 🔗 Important URLs

| URL | Purpose |
|-----|---------|
| `/` | Landing page with waitlist |
| `/privacy-policy.html` | Privacy policy |
| `/auth` | Authentication (if using Next.js version) |

### 📊 Supabase Integration

**Tables:**
- `profiles` - User accounts
- `usage_logs` - Daily usage tracking
- `waitlist` - Email collection

**Auth:**
- Email/password authentication
- Session synced to Chrome extension via cookies

### 📝 Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://ioyqxwmgfdqzokwqpgdv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XCn2apCq33VxNF8yXv82MA_L9Pg9ntG
```

### 🧪 Testing Checklist

- [ ] Landing page loads correctly
- [ ] Waitlist form submits to Supabase
- [ ] Privacy policy accessible
- [ ] Auth pages work (if applicable)
- [ ] Chrome extension detects auth session
- [ ] Mobile responsive

### 🔄 Post-Deployment

After deploying to Vercel:
1. Update Chrome extension manifest with new domain if changed
2. Test extension auth flow
3. Update Chrome Web Store listing with live URL

### 📧 Support

- Email: engagedloop@gmail.com
- GitHub: https://github.com/SaaSbuilder-maker/Engagedloop
