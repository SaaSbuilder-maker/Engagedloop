# ENGAGEDLOOP - Chrome Web Store Submission Guide

## 🚀 READY TO SUBMIT

---

## 📋 PART 1: STORE LISTING DETAILS (Copy-Paste Ready)

### **1. Title**
```
ENGAGEDLOOP - AI Reply Assistant for X
```

### **2. Short Description** (Max 132 chars)
```
Generate human-like replies on X when you don't know what to say. Edit & post manually.
```

### **3. Full Description**
```
ENGAGEDLOOP helps you reply faster and better on X (Twitter).

HOW IT WORKS:
1. Click the [EΣ] button on any tweet
2. Get 3 AI-generated reply suggestions instantly
3. Edit and paste into your reply box

KEY FEATURES:
✓ Smart Reply Generation - Context-aware AI suggestions
✓ Quick Paste Mode - Generate replies from any text
✓ Safety First - Edit every reply before posting
✓ Daily Playbook - Track your engagement routine
✓ No Automation - You control every action

PERFECT FOR:
• Founders building in public
• Indie hackers engaging with community
• Creators growing their audience
• Anyone wanting better replies on X

PRIVACY:
• No data collection
• No tracking or analytics
• API key stored locally only
• Tweet content processed temporarily

⚠️ IMPORTANT:
Always edit replies before posting. This is an assistant tool, not automation.
```

### **4. Category**
```
Social & Communication
```

### **5. Language**
```
English
```

### **6. Privacy Policy URL**
```
https://engagedloop.vercel.app/privacy-policy.html
```

---

## 🖼️ PART 2: SCREENSHOTS (REQUIRED)

You need **5 screenshots** (1280x800 or 640x400):

### Screenshot 1: Reply Button on Tweet
- Go to X.com
- Find a tweet
- Screenshot showing the [EΣ] button next to tweet actions
- **Filename:** `screenshot-1-button.png`

### Screenshot 2: Sidebar Open
- Click [EΣ] button
- Screenshot showing the sidebar with "ANALYZE_TWEET_CONTENT" header
- **Filename:** `screenshot-2-sidebar.png`

### Screenshot 3: Generated Replies
- After clicking "GENERATE_REPLIES"
- Show the 3 reply options in the sidebar
- **Filename:** `screenshot-3-replies.png`

### Screenshot 4: Playbook Dashboard
- Click "DAILY_ROUTINE" tab
- Show the daily routine / playbook view
- **Filename:** `screenshot-4-playbook.png`

### Screenshot 5: Quick Paste Mode
- Show the "Paste Tweet Text" section
- **Filename:** `screenshot-5-paste.png`

**Screenshot Tips:**
- Clean browser (no bookmarks bar)
- Dark mode matches extension aesthetic
- Clear, readable text
- No personal info visible

---

## 🎨 PART 3: PROMOTIONAL IMAGES

### Small Promo (440x280)
- Simple graphic with logo + tagline
- **Text:** "Reply Smarter on X"

### Large Promo (920x680)
- Feature showcase graphic
- **Text:** "AI-Powered Replies for X"

### Marquee (1400x560)
- Wide banner style
- **Text:** "Generate Better Replies - Stay Consistent - Grow Your Presence"

**Design Tips:**
- Use black background (#000000)
- Orange accent (#f97316)
- Monospace font
- Keep it minimal/brutalist

---

## 🔒 PART 4: COMPLIANCE CHECKLIST

### Permissions (Verify in manifest.json)
```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://twitter.com/*", "https://x.com/*"]
}
```
✅ Minimal permissions only

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com/"
  }
}
```
✅ Proper CSP set

### Safety Messages (Must be visible in UI)
- [x] "EDIT_BEFORE_POSTING - ALWAYS"
- [x] "DON'T USE FOR EVERY REPLY"
- [x] Warning about automation

### No Misleading Claims
- [x] No "guaranteed growth" claims
- [x] No "automatic posting" implied
- [x] Clear it's an assistant tool

---

## 📦 PART 5: PACKAGE & UPLOAD

### Files to Include in ZIP:
```
engagedloop.zip
├── manifest.json
├── content-brutalist.js
├── popup-brutalist.html
├── popup-brutalist.js
├── PRIVACY.md
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── icon.svg
```

### Files to EXCLUDE:
- ❌ landing-page-brutalist.html
- ❌ privacy-policy.html
- ❌ index.html
- ❌ icon-generator.html
- ❌ CHROME_STORE_*.md files
- ❌ README.md (unless you want it)

### Upload Steps:
1. Create ZIP with files above
2. Go to https://chrome.google.com/webstore/devconsole
3. Click "New Item"
4. Upload ZIP
5. Fill all fields (use Part 1 above)
6. Upload screenshots
7. Add privacy policy URL
8. Submit for review

---

## ⏱️ PART 6: WHAT TO EXPECT

### Review Timeline:
- **Simple extensions:** 1-3 days
- **With AI/content scripts:** 3-7 days
- **Rejection common if:** Permissions wrong, missing privacy policy, misleading claims

### Common Rejection Reasons (Avoid These):
❌ Missing privacy policy
❌ Too many permissions
❌ "Tabs" permission not justified
❌ Claims of automation
❌ Promises of growth/followers
❌ Screenshots don't match actual UI

---

## ✅ FINAL CHECKLIST BEFORE SUBMIT

- [ ] Extension tested on X.com
- [ ] All buttons working
- [ ] No console errors
- [ ] Screenshots taken (5 images)
- [ ] Privacy policy URL works
- [ ] Store listing text ready
- [ ] ZIP file prepared correctly
- [ ] $5 developer fee paid
- [ ] Icons all present (16, 48, 128)

---

## 🎯 QUICK REFERENCE: Copy These Directly

**Title:** ENGAGEDLOOP - AI Reply Assistant for X

**Short Desc:** Generate human-like replies on X when you don't know what to say. Edit & post manually.

**Full Desc:** [See Part 1 above - copy entire block]

**Privacy URL:** https://engagedloop.vercel.app/privacy-policy.html

**Category:** Social & Communication

---

READY TO SUBMIT! 🚀
