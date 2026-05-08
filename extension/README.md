# ENGAGEDLOOP Chrome Extension

## Chrome Web Store Submission Package

This folder contains the complete Chrome extension for submission to the Chrome Web Store.

### 📁 Files Included

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration (v3) |
| `content-brutalist.js` | Main content script for X/Twitter |
| `popup-brutalist.html` | Extension popup UI |
| `popup-brutalist.js` | Popup functionality |
| `icons/` | Extension icons (16px, 48px, 128px) |

### 🚀 Submission Steps

1. **Zip this folder** (not the entire repo, just this `extension/` folder)
   ```
   cd extension
   zip -r engagedloop-extension.zip .
   ```

2. **Go to Chrome Web Store Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole

3. **Upload the ZIP file**
   - Click "New Item"
   - Upload `engagedloop-extension.zip`

4. **Fill Store Listing Details**

   **Product Details:**
   - Category: Productivity
   - Language: English
   - **Store Description:**
   ```
   ENGAGEDLOOP - Reply smarter on X when you don't know what to say.

   Features:
   ⚡ Generate 3 targeted replies instantly
   ⚡ Engagement mode for better response chance
   ⚡ Paste tweet mode for quick generation
   ⚡ Post generator for writing your own content
   ⚡ Personal writing style customization
   ⚡ Daily usage tracking with sync across devices

   Perfect for:
   - Founders building in public
   - Creators engaging with their audience
   - Anyone who wants better replies faster

   Free: 3 replies/day
   Pro: 30 replies/day + all features
   ```

   **Screenshots:** (1280x800 or 640x400)
   - Screenshot 1: Main sidebar on X
   - Screenshot 2: Reply generation in action
   - Screenshot 3: Post generator feature

   **Promotional Images:**
   - Small promo: 440x280
   - Large promo: 920x680 (optional)

5. **Privacy Practices**
   - Data usage: "User data is stored locally and synced via Supabase for authenticated users only"
   - Privacy policy: https://engagedloop.vercel.app/privacy-policy.html

6. **Submit for Review**
   - Click "Submit for Review"
   - Wait 1-3 days for approval

### 🔐 Permissions Used

| Permission | Reason |
|------------|--------|
| `activeTab` | To detect current tweet on X/Twitter |
| `storage` | To save API key and usage locally |
| `cookies` | To read Supabase auth session |
| Host: `twitter.com/*` | To inject reply assist buttons |
| Host: `x.com/*` | To inject reply assist buttons |
| Host: `supabase.co/*` | To sync data with backend |

### 📝 Version History

- v1.0.0 - Initial release with Supabase integration

### 🔗 Links

- Privacy Policy: https://engagedloop.vercel.app/privacy-policy.html
- Support Email: engagedloop@gmail.com
- Website: https://engagedloop.vercel.app

### ⚠️ Pre-Submission Checklist

- [ ] Icons present in all sizes (16, 48, 128)
- [ ] No console.log statements in code
- [ ] Manifest version correct (3)
- [ ] CSP includes all required URLs
- [ ] Privacy policy link works
- [ ] Extension loads without errors
- [ ] All features tested on X/Twitter
