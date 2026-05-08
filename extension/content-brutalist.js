/**
 * ENGAGEDLOOP - Brutalist Engineering Aesthetic
 * 
 * Design System:
 * - Background: #000000
 * - Panels: #0a0a0a
 * - Borders: #222222
 * - Primary Accent: #f97316 (orange)
 * - Alert Accent: #ef4444 (red)
 * - Typography: Menlo, Monaco, Courier New (monospace)
 * - Vibe: Raw, inspection-level, technical
 */

(function() {
  'use strict';

  // Extension initialized

  // Gemini API (Google AI Studio)
  // Using: gemini-2.5-flash only
  const GEMINI_MODEL = 'gemini-2.5-flash';
  const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  // DAILY USAGE LIMIT
  const DAILY_LIMIT = 20;
  let usageCount = 0;
  let lastResetDate = null;
  let sessionStartTime = Date.now();
  let apiKey = null;
  let supabaseClient = null;
  let currentUser = null;
  let userProfile = null;

  // SUPABASE CONFIG
  const SUPABASE_URL = 'https://ioyqxwmgfdqzokwqpgdv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_XCn2apCq33VxNF8yXv82MA_L9Pg9ntG';

  // Initialize Supabase client (using fetch-based client for Chrome extension)
  function initSupabase() {
    return {
      auth: {
        getSession: async () => {
          // Get session from cookie (set by web version)
          return new Promise((resolve) => {
            chrome.cookies.get({
              url: 'https://engagedloop.vercel.app',
              name: 'sb-ioyqxwmgfdqzokwqpgdv-auth-token'
            }, (cookie) => {
              if (cookie && cookie.value) {
                try {
                  const session = JSON.parse(decodeURIComponent(cookie.value));
                  resolve({ data: { session }, error: null });
                } catch {
                  resolve({ data: { session: null }, error: null });
                }
              } else {
                resolve({ data: { session: null }, error: null });
              }
            });
          });
        }
      },
      from: (table) => ({
        select: (columns) => ({
          eq: (column, value) => ({
            single: async () => {
              const { data: { session } } = await supabaseClient.auth.getSession();
              if (!session) return { data: null, error: { message: 'No session' } };
              
              const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) return { data: null, error: { message: 'Fetch failed' } };
              const data = await response.json();
              return { data: data[0] || null, error: null };
            }
          }),
          order: (column, { ascending }) => ({
            limit: (n) => ({
              data: null,
              error: null
            })
          })
        }),
        insert: async (data) => {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (!session) return { error: { message: 'No session' } };
          
          const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            const error = await response.text();
            return { error: { message: error } };
          }
          return { error: null };
        },
        update: async (data) => {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (!session) return { error: { message: 'No session' } };
          
          const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${session.user.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) return { error: { message: 'Update failed' } };
          return { error: null };
        }
      }),
      rpc: async (fnName, params) => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return { data: null, error: { message: 'No session' } };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) return { data: null, error: { message: 'RPC failed' } };
        const data = await response.json();
        return { data, error: null };
      }
    };
  }

  // Initialize Supabase
  supabaseClient = initSupabase();

  // Load user data from Supabase + fallback to local storage
  async function initExtension() {
    // First try to get from local storage (fallback)
    const localData = await new Promise(resolve => {
      chrome.storage.local.get(['apiKey', 'usageCount', 'lastResetDate', 'hasSeenOnboarding', 'hasSeenTwitterConnect'], resolve);
    });
    
    // Set local values as fallback
    apiKey = localData.apiKey || null;
    usageCount = localData.usageCount || 0;
    lastResetDate = localData.lastResetDate || null;
    
    // Try to get Supabase session
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      
      // Fetch user profile from Supabase
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_pro, writing_style_samples, preferred_tone, email')
        .eq('id', currentUser.id)
        .single();
      
      if (profile) {
        userProfile = profile;
        
        // Sync to local storage for popup access
        chrome.storage.local.set({
          supabaseUser: currentUser.email,
          isPro: profile.is_pro,
          preferredTone: profile.preferred_tone
        });
        
        // Get API key from profile or local storage
        // Note: In production, you'd want to encrypt this
        if (localData.apiKey) {
          // Sync local API key to Supabase if not already there
          // This would require a secure storage solution
        }
      }
      
      // Check daily usage from Supabase
      const { data: dailyCount } = await supabaseClient.rpc('get_daily_usage', {
        p_user_id: currentUser.id
      });
      
      if (dailyCount !== null) {
        usageCount = dailyCount;
        // Update local storage for offline fallback
        chrome.storage.local.set({ usageCount: dailyCount });
      }
    } else {
      // No Supabase session, use local storage only
      const today = new Date().toDateString();
      if (lastResetDate !== today) {
        usageCount = 0;
        lastResetDate = today;
        chrome.storage.local.set({ usageCount: 0, lastResetDate: today });
      }
      
      // Clear Supabase user data from local storage
      chrome.storage.local.remove(['supabaseUser', 'isPro', 'preferredTone']);
    }
    
    // Extension loaded
    
    // Onboarding flow: Twitter Connect first, then System Init
    if (apiKey) {
      if (!localData.hasSeenTwitterConnect) {
        setTimeout(showTwitterConnect, 2000);
      } else if (!localData.hasSeenOnboarding) {
        setTimeout(showOnboarding, 2000);
      }
    }
  }

  // Initialize extension on load
  initExtension().catch(() => {
    // Silent fail - extension will work with local storage fallback
  });

  async function trackUsage(actionType = 'reply_gen') {
    usageCount++;
    chrome.storage.local.set({ usageCount });
    
    // Log to Supabase if user is logged in
    if (currentUser && supabaseClient) {
      try {
        await supabaseClient.from('usage_logs').insert({
          user_id: currentUser.id,
          action_type: actionType
        });
      } catch (err) {
        // Silent fail - local storage is fallback
      }
    }
    
    return usageCount;
  }

  // Check if user can generate (within daily limits)
  async function canUseSupabase() {
    if (!currentUser || !supabaseClient) {
      // Fallback to local storage
      return usageCount < DAILY_LIMIT;
    }
    
    try {
      const { data: canGenerate } = await supabaseClient.rpc('check_daily_limit', {
        p_user_id: currentUser.id
      });
      
      if (canGenerate !== null) {
        return canGenerate;
      }
    } catch (err) {
      // Fallback to local storage
    }
    
    return usageCount < DAILY_LIMIT;
  }

  // Get user limit (3 for free, 30 for pro)
  async function getUserLimit() {
    if (userProfile?.is_pro) return 30;
    return 3; // Free tier limit from Supabase
  }

  // Get user's writing style for AI prompt
  async function getWritingStyle() {
    if (userProfile?.writing_style_samples) {
      return {
        samples: userProfile.writing_style_samples,
        tone: userProfile.preferred_tone || 'casual'
      };
    }
    return null;
  }

  function canUse() {
    return usageCount < DAILY_LIMIT;
  }

  function getUptime() {
    const diff = Date.now() - sessionStartTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }

  const REPLY_SYSTEM_PROMPT = `
You are a real human casually replying to a tweet.

Your goal is to write replies that feel natural AND make the author want to respond.

RULES:
- 1–2 lines (max 3)
- simple, human language
- slightly imperfect is okay
- avoid generic phrases like "great post"
- no hashtags, no emojis
- vary tone (agree, question, slight disagreement)

CRITICAL - NEVER USE SAME STRUCTURE TWICE:
- Vary reply length: sometimes 1 line, sometimes 2-3
- Mix styles: insight, question, perspective, challenge - don't repeat pattern
- Imperfect grammar okay: "hmm..." "wait" "actually"
- Vary openings: start with reaction, statement, or question randomly
- Some replies shorter, some longer - unpredictable

AVOID:
- basic reactions
- empty praise
- obvious questions
- same formula every time

Make replies feel:
- thoughtful
- specific to the tweet
- worth replying to
- HUMAN (varied, imperfect, unpredictable)

OUTPUT:
Reply 1:
Reply 2:
Reply 3:

TWEET:
{{tweet}}
`;

  const POST_SYSTEM_PROMPT = ` 
You are a founder building in public on X.

Turn raw thoughts into short, engaging posts.

RULES:
- 1–4 lines
- casual, real tone
- no generic motivation
- based on real experience or observation
- strong first line that creates curiosity
- slightly imperfect is okay

Make posts feel:
- honest
- specific
- relatable

OUTPUT:
Post 1:
Post 2:

INPUT:
{{idea}}
`;

  const ENGAGEMENT_REPLY_SYSTEM_PROMPT = `
You are a human who wants to start REAL conversations on X.

Your goal: Write replies that make the author STOP and reply back.

🧠 THE FORMULA (use this structure):
Hook/Reaction → Small Opinion → Question

EXAMPLE UPGRADE:
❌ Before: "are you doing X?"
✅ After: "X seems risky... are you doing that?"

RULES:
- 1–2 lines max (can be 2 short sentences)
- casual, imperfect language
- NO generic praise like "great post"
- NO emojis, NO hashtags
- sound like a real person texting a friend

ENGAGEMENT TACTICS (vary these, don't use same one twice):
1️⃣ STATEMENT + QUESTION:
   - "[opinion]... [question]?"
   - Mix: short statements, long questions, vice versa

2️⃣ HOT TAKE:
   - "seems intense / risky / interesting..."
   - Then follow-up (vary length each time)

3️⃣ PATTERN INTERRUPT:
   - "wait..." / "hmm..." / "actually..."
   - Unexpected starts

4️⃣ CASUAL AGREEMENT + TWIST:
   - "makes sense, but what about..."
   - "true, though I've seen..."

CRITICAL - NEVER BE PREDICTABLE:
- Each reply: different structure, different length
- Some start with opinion, some with question, some with reaction
- Imperfect grammar: "hmm..." "tbh" "honestly"
- Vary: 1 line, 2 lines, short+short, long question

AVOID AT ALL COSTS:
- Same pattern every time (robot)
- Plain questions without opinion first
- "Great post!" / "Thanks for sharing"
- Sounding calculated or formulaic

OUTPUT:
Reply 1:
Reply 2:
Reply 3:

TWEET:
{{tweet}}
`;

  let processedTweets = new WeakSet();
  let activeSidebar = null;
  let uptimeInterval = null;

  // BRUTALIST STYLES
  const BRUTALIST_STYLES = `
    :host {
      display: block;
      font-family: Menlo, Monaco, 'Courier New', monospace;
    }
    
    .algo-center {
      background: #0a0a0a;
      border: 1px solid #222222;
      color: #e5e5e5;
      width: 320px;
      max-height: 85vh;
      overflow-y: auto;
      position: fixed;
      right: 20px;
      top: 10px;
      z-index: 999999;
      box-shadow: 0 0 40px rgba(0,0,0,0.9);
    }
    
    /* Header */
    .algo-header {
      background: #0a0a0a;
      border-bottom: 1px solid #222222;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .algo-title {
      color: #666666;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    
    .algo-uptime {
      color: #f97316;
      font-size: 11px;
    }
    
    .algo-close {
      background: none;
      border: none;
      color: #666666;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
    }
    
    .algo-close:hover {
      color: #f97316;
    }
    
    /* Section Labels */
    .section-label {
      color: #666666;
      font-size: 11px;
      padding: 12px 16px 8px;
      letter-spacing: 0.5px;
      border-top: 1px solid #222222;
    }
    
    .section-label:first-of-type {
      border-top: none;
    }
    
    /* Reply Cards */
    .reply-card {
      background: #111111;
      border: 1px solid #222222;
      margin: 0 16px 8px;
      padding: 12px;
      position: relative;
    }
    
    .reply-card:hover {
      border-color: #333333;
    }
    
    .reply-text {
      color: #e5e5e5;
      font-size: 12px;
      line-height: 1.6;
      margin-bottom: 10px;
      white-space: pre-wrap;
    }
    
    .reply-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-paste {
      background: #0a0a0a;
      border: 1px solid #f97316;
      color: #f97316;
      padding: 4px 12px;
      font-size: 10px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
      text-transform: uppercase;
    }
    
    .btn-paste:hover {
      background: rgba(249, 115, 22, 0.1);
    }
    
    .btn-copy {
      background: transparent;
      border: 1px solid #333333;
      color: #666666;
      padding: 4px 12px;
      font-size: 10px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
    }
    
    .btn-copy:hover {
      border-color: #666666;
      color: #999999;
    }
    
    /* Regenerate Button */
    .btn-regen {
      background: #000000;
      border: 1px solid #444444;
      color: #ffffff;
      padding: 10px 16px;
      font-size: 11px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
      margin: 8px 16px 16px;
      width: calc(100% - 32px);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .btn-regen:hover {
      border-color: #666666;
      background: #0a0a0a;
    }
    
    .btn-regen:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Quick Paste Section */
    .quick-paste-area {
      margin: 0 16px 16px;
    }
    
    .paste-input {
      width: 100%;
      min-height: 80px;
      background: #000000;
      border: 1px solid #333333;
      color: #e5e5e5;
      padding: 12px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      font-size: 12px;
      resize: vertical;
      box-sizing: border-box;
      line-height: 1.5;
    }
    
    .paste-input:focus {
      outline: none;
      border-color: #f97316;
    }
    
    .paste-input::placeholder {
      color: #444444;
    }
    
    .btn-generate {
      background: #000000;
      border: 1px solid #f97316;
      color: #f97316;
      padding: 10px 16px;
      font-size: 11px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
      width: 100%;
      margin-top: 8px;
      text-transform: uppercase;
    }
    
    .btn-generate:hover {
      background: rgba(249, 115, 22, 0.1);
    }
    
    /* Post Tab */
    .post-tab {
      padding: 0 16px 16px;
    }
    
    .usage-indicator {
      color: #f97316;
      font-size: 11px;
      margin-bottom: 12px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .metric-box {
      background: #111111;
      border: 1px solid #222222;
      padding: 12px;
    }
    
    .metric-label {
      color: #666666;
      font-size: 9px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .metric-bar {
      height: 4px;
      background: #222222;
      position: relative;
    }
    
    .metric-fill {
      height: 100%;
      background: #f97316;
    }
    
    /* Safety Section */
    .safety-section {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin: 16px;
      padding: 12px;
    }
    
    .safety-label {
      color: #ef4444;
      font-size: 11px;
      margin-bottom: 8px;
    }
    
    .safety-text {
      color: #ef4444;
      font-size: 10px;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    
    /* Loading */
    .loading-state {
      padding: 24px;
      text-align: center;
      color: #666666;
      font-size: 11px;
    }
    
    .loading-state::after {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #f97316;
      border-top-color: transparent;
      border-radius: 50%;
      margin-left: 8px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Error */
    .error-state {
      color: #ef4444;
      font-size: 11px;
      padding: 16px;
      text-align: center;
    }
    
    /* Toggle Button */
    .algo-toggle-btn {
      background: #0a0a0a;
      border: 1px solid #f97316;
      color: #f97316;
      padding: 8px 12px;
      font-size: 10px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
      margin-left: 8px;
      text-transform: uppercase;
    }
    
    .algo-toggle-btn:hover {
      background: rgba(249, 115, 22, 0.1);
    }
    
    .algo-toggle-btn.active {
      background: #f97316;
      color: #000000;
    }
  `;

  const BUTTON_STYLES = `
    :host {
      display: inline-flex;
      align-items: center;
    }
    
    .algo-trigger-btn {
      background: #0a0a0a;
      border: 1px solid #333333;
      color: #f97316;
      padding: 4px 10px;
      font-size: 10px;
      font-family: Menlo, Monaco, 'Courier New', monospace;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .algo-trigger-btn:hover {
      border-color: #f97316;
      background: rgba(249, 115, 22, 0.1);
    }
  `;

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAY_BASE = 2000; // 2 seconds base

  async function tryGemini(prompt, apiKeyToUse, attempt = 1) {
    try {
      const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKeyToUse}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 40
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // API retry needed
        
        if (response.status === 400) {
          throw new Error('ERR: INVALID_API_KEY');
        }
        
        // Retry on 429 (rate limit) and 503 (overloaded)
        if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
          // Exponential backoff with jitter: 2s, 4s, 8s + random 0-1s
          const delay = (RETRY_DELAY_BASE * Math.pow(2, attempt - 1)) + (Math.random() * 1000);
          // Retrying API call
          await new Promise(resolve => setTimeout(resolve, delay));
          return tryGemini(prompt, apiKeyToUse, attempt + 1);
        }
        
        if (response.status === 429) {
          throw new Error('ERR: RATE_LIMIT_EXCEEDED - Too many requests. Wait 1-2 minutes.');
        }
        if (response.status === 503) {
          throw new Error('ERR: GEMINI_OVERLOADED - Servers busy. Try again in 1 minute.');
        }
        
        return null;
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text) {
        // API call successful
        return text;
      }
      
      return null;
    } catch (err) {
      // Network errors - retry
      if (attempt < MAX_RETRIES && (err.message.includes('fetch') || err.message.includes('network'))) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        // Network error, will retry
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryGemini(prompt, apiKeyToUse, attempt + 1);
      }
      
      // API error occurred
      throw err;
    }
  }

  // Load user style context from storage
  async function loadUserContext() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userRole', 'userLocation', 'userTone', 'referenceTweets'], (result) => {
        if (!result.userRole && !result.userTone) {
          resolve(null);
          return;
        }
        resolve({
          role: result.userRole || '',
          location: result.userLocation || '',
          tone: result.userTone || '',
          referenceTweets: result.referenceTweets || []
        });
      });
    });
  }

  async function generateContent(text, mode = 'reply', replyMode = 'generic') {
    if (!apiKey) {
      throw new Error('INPUT> ERR: API_KEY_MISSING');
    }

    // Check Supabase limits first, fallback to local
    const canGenerate = await canUseSupabase();
    if (!canGenerate) {
      const limit = await getUserLimit();
      throw new Error(`ERR: DAILY_LIMIT_REACHED [${usageCount}/${limit}]`);
    }

    let prompt;
    if (mode === 'post') {
      prompt = POST_SYSTEM_PROMPT.replace('{{idea}}', text);
    } else {
      // Reply mode: choose prompt based on selected type
      const replyPrompt = replyMode === 'engagement' ? ENGAGEMENT_REPLY_SYSTEM_PROMPT : REPLY_SYSTEM_PROMPT;
      prompt = replyPrompt.replace('{{tweet}}', text);
    }
    
    // Add local user context if configured (from dashboard)
    const userContext = await loadUserContext();
    if (userContext) {
      let contextString = '\n\nUSER_CONTEXT: "';
      if (userContext.role) contextString += `The user is a ${userContext.role}`;
      if (userContext.location) contextString += ` from ${userContext.location}`;
      if (userContext.tone) contextString += `. They write in a ${userContext.tone} tone`;
      contextString += '."';
      
      if (userContext.referenceTweets && userContext.referenceTweets.length > 0) {
        contextString += `\n\nMIMIC_STYLE: "Match the writing style, length, and casing of these examples: ${userContext.referenceTweets.join(' | ')}"`;
      }
      
      prompt += contextString;
    }
    
    // Add Supabase profile writing style if available (takes priority)
    const writingStyle = await getWritingStyle();
    if (writingStyle && writingStyle.samples) {
      prompt += `\n\nWRITING_STYLE: "The user's preferred tone is ${writingStyle.tone}. Mimic this exact writing style from their examples: ${writingStyle.samples}"`;
    }
    
    const responseText = await tryGemini(prompt, apiKey);
    
    if (!responseText) {
      throw new Error('ERR: GENERATION_FAILED');
    }
    
    // Track usage with action type
    const actionType = mode === 'post' ? 'post_gen' : 'reply_gen';
    await trackUsage(actionType);
    
    const responses = [];
    const prefix = mode === 'post' ? 'Post' : 'Reply';
    const count = mode === 'post' ? 2 : 3;
    
    for (let i = 1; i <= count; i++) {
      const match = responseText.match(new RegExp(`${prefix}\\s*${i}[:\\-]?\\s*([^\\n]*(?:\\n(?:(?!${prefix}\\s*\\d).)*)*)`, 'i'));
      if (match?.[1]) {
        const clean = match[1].trim().replace(/\n+/g, ' ');
        if (clean.length > 5) responses.push(clean);
      }
    }
    
    return responses.length > 0 ? responses : ['ERR: PARSE_FAILED'];
  }

  function createBrutalistSidebar(tweetText, tweetElement) {
    if (activeSidebar) {
      activeSidebar.remove();
      clearInterval(uptimeInterval);
    }

    const host = document.createElement('div');
    host.className = 'echoreply-sidebar-host';
    
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = BRUTALIST_STYLES;
    shadow.appendChild(style);
    
    const sidebar = document.createElement('div');
    sidebar.className = 'algo-center';
    
    // Header
    const header = document.createElement('div');
    header.className = 'algo-header';
    header.innerHTML = `
      <span class="algo-title">// ENGAGEDLOOP v1.0</span>
      <div>
        <span class="algo-uptime" id="uptime">0d 00h 00m 00s</span>
        <button class="algo-close">&times;</button>
      </div>
    `;
    header.querySelector('.algo-close').addEventListener('click', () => {
      host.remove();
      clearInterval(uptimeInterval);
      activeSidebar = null;
    });
    sidebar.appendChild(header);
    
    // User instruction line
    const instructionLine = document.createElement('div');
    instructionLine.style.cssText = 'padding: 10px 0; color: #f97316; font-size: 11px; text-align: center; letter-spacing: 0.3px;';
    instructionLine.textContent = '→ Generate better replies instantly → pick one → edit → post';
    sidebar.appendChild(instructionLine);
    
    // Update uptime
    uptimeInterval = setInterval(() => {
      const uptimeEl = sidebar.querySelector('#uptime');
      if (uptimeEl) uptimeEl.textContent = getUptime();
    }, 1000);
    
    // Section: Reply Assist
    const replyLabel = document.createElement('div');
    replyLabel.className = 'section-label';
    replyLabel.textContent = '💬 REPLY_ASSIST';
    sidebar.appendChild(replyLabel);
    
    // Mode Selector: Generic vs Engagement
    const modeSelector = document.createElement('div');
    modeSelector.style.cssText = 'margin: 0 16px 12px; display: flex; gap: 8px;';
    modeSelector.innerHTML = `
      <button class="mode-btn active" data-mode="generic" style="flex: 1; background: #111; border: 1px solid #333; color: #666; padding: 8px; font-family: Menlo, Monaco, monospace; font-size: 10px; cursor: pointer;">[GENERIC]</button>
      <button class="mode-btn" data-mode="engagement" style="flex: 1; background: #111; border: 1px solid #333; color: #666; padding: 8px; font-family: Menlo, Monaco, monospace; font-size: 10px; cursor: pointer;">[ENGAGEMENT]</button>
    `;
    const genericBtn = modeSelector.querySelector('[data-mode="generic"]');
    const engagementBtn = modeSelector.querySelector('[data-mode="engagement"]');
    
    let selectedMode = 'generic';
    
    function updateModeButtons() {
      if (selectedMode === 'generic') {
        genericBtn.style.borderColor = '#f97316';
        genericBtn.style.color = '#f97316';
        engagementBtn.style.borderColor = '#333';
        engagementBtn.style.color = '#666';
      } else {
        engagementBtn.style.borderColor = '#f97316';
        engagementBtn.style.color = '#f97316';
        genericBtn.style.borderColor = '#333';
        genericBtn.style.color = '#666';
      }
    }
    
    const repliesContainer = document.createElement('div');
    repliesContainer.id = 'replies-container';
    sidebar.appendChild(repliesContainer);
    
    // Generate button (initial)
    const generateBtn = document.createElement('button');
    generateBtn.className = 'btn-regen';
    generateBtn.textContent = '[GENERATE_REPLIES]';
    generateBtn.style.background = '#f97316';
    generateBtn.style.color = '#000';
    generateBtn.style.border = 'none';
    
    // Mode change + regenerate
    genericBtn.addEventListener('click', () => { 
      selectedMode = 'generic'; 
      updateModeButtons(); 
      if (repliesContainer.children.length > 0) {
        loadReplies(tweetText, repliesContainer, generateBtn, tweetElement, selectedMode);
      }
    });
    engagementBtn.addEventListener('click', () => { 
      selectedMode = 'engagement'; 
      updateModeButtons(); 
      if (repliesContainer.children.length > 0) {
        loadReplies(tweetText, repliesContainer, generateBtn, tweetElement, selectedMode);
      }
    });
    updateModeButtons();
    sidebar.appendChild(modeSelector);
    
    // Initial generate button
    generateBtn.addEventListener('click', () => {
      loadReplies(tweetText, repliesContainer, generateBtn, tweetElement, selectedMode);
      generateBtn.textContent = '[REGENERATE_ALL]';
      generateBtn.style.background = '#000';
      generateBtn.style.color = '#fff';
      generateBtn.style.border = '1px solid #444';
    });
    sidebar.appendChild(generateBtn);
    
    // Show initial prompt
    repliesContainer.innerHTML = '<div style="padding: 16px; color: #666; font-size: 11px; text-align: center;">// SELECT MODE → CLICK GENERATE</div>';
    
    // Section: Quick Paste
    const pasteLabel = document.createElement('div');
    pasteLabel.className = 'section-label';
    pasteLabel.textContent = '⚡ Paste tweet';
    sidebar.appendChild(pasteLabel);
    
    const pasteArea = document.createElement('div');
    pasteArea.className = 'quick-paste-area';
    pasteArea.innerHTML = `
      <textarea class="paste-input" placeholder="// INPUT> paste tweet text here..."></textarea>
      <button class="btn-generate">[GENERATE]</button>
    `;
    const pasteInput = pasteArea.querySelector('.paste-input');
    const pasteGenerateBtn = pasteArea.querySelector('.btn-generate');
    
    pasteGenerateBtn.addEventListener('click', () => {
      const text = pasteInput.value.trim();
      if (text.length < 5) {
        pasteInput.style.borderColor = '#ef4444';
        setTimeout(() => pasteInput.style.borderColor = '#333333', 1000);
        return;
      }
      loadReplies(text, repliesContainer, generateBtn, tweetElement, selectedMode);
    });
    sidebar.appendChild(pasteArea);
    
    // Section: Post Tab
    const postLabel = document.createElement('div');
    postLabel.className = 'section-label';
    const userLimit = userProfile?.is_pro ? 30 : 3;
    const connStatus = currentUser ? `🟢 ${userProfile?.email || 'CONNECTED'}` : '⚪ LOCAL_MODE';
    postLabel.innerHTML = `✍️ Write your post [${String(usageCount).padStart(3, '0')}/${userLimit}] <span style="float:right;font-size:10px;color:#666">${connStatus}</span>`;
    sidebar.appendChild(postLabel);
    
    const postTab = document.createElement('div');
    postTab.className = 'post-tab';
    postTab.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">PERSONAL_USAGE</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${(usageCount/(userProfile?.is_pro ? 30 : 3))*100}%"></div>
          </div>
          <div style="font-size:9px;color:#666;margin-top:4px">${usageCount}/${userProfile?.is_pro ? 30 : 3} ${userProfile?.is_pro ? '⭐ PRO' : 'FREE'}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">VOLUME_METRICS</div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${Math.min((usageCount/(userProfile?.is_pro ? 30 : 3))*100 + 20, 100)}%"></div>
          </div>
          <div style="font-size:9px;color:#666;margin-top:4px">${currentUser ? '🟢 SYNCED' : '⚪ LOCAL'}</div>
        </div>
      </div>
      <textarea class="paste-input" placeholder="// INPUT> raw idea for post generation..." style="margin-bottom: 8px;"></textarea>
      <button class="btn-generate" id="post-generate">[GENERATE_POSTS]</button>
    `;
    
    const postInput = postTab.querySelector('textarea');
    postTab.querySelector('#post-generate').addEventListener('click', () => {
      const idea = postInput.value.trim();
      if (idea.length < 5) return;
      loadPosts(idea, repliesContainer, generateBtn);
    });
    sidebar.appendChild(postTab);
    
    // Section: Safety
    const safetySection = document.createElement('div');
    safetySection.className = 'safety-section';
    safetySection.innerHTML = `
      <div class="safety-label">⚠️ SAFETY / ANTI-DETECTION</div>
      <div class="safety-text">[EDIT_BEFORE_POSTING - ALWAYS]</div>
      <div class="safety-text">[!! DON'T USE FOR EVERY REPLY !!]</div>
      <div class="safety-text">[SPACE_OUT: 5-10 min between AI replies]</div>
      <div class="safety-text">[MIX: Type some manually]</div>
      <div class="safety-text">[X TRACKS: Patterns, Timing, Similarity]</div>
    `;
    sidebar.appendChild(safetySection);
    
    // Section: Playbook Toggle
    const playbookSection = document.createElement('div');
    playbookSection.style.cssText = 'margin: 16px; border-top: 1px solid #222; padding-top: 12px;';
    playbookSection.innerHTML = `
      <button class="btn-regen" id="playbook-btn">[OPEN_PLAYBOOK_DASHBOARD]</button>
    `;
    playbookSection.querySelector('#playbook-btn').addEventListener('click', showPlaybookDashboard);
    sidebar.appendChild(playbookSection);
    
    shadow.appendChild(sidebar);
    document.body.appendChild(host);
    activeSidebar = host;
    
    return host;
  }

  async function loadReplies(text, container, regenBtn, tweetElement, replyMode = 'generic') {
    container.innerHTML = '<div class="loading-state">// PROCESSING...</div>';
    regenBtn.disabled = true;
    
    try {
      const replies = await generateContent(text, 'reply', replyMode);
      container.innerHTML = '';
      
      replies.forEach((reply, idx) => {
        const card = document.createElement('div');
        card.className = 'reply-card';
        card.innerHTML = `
          <div class="reply-text">[DRAFT_${String.fromCharCode(65 + idx)}]: ${reply}</div>
          <div class="reply-actions">
            <button class="btn-paste">[PASTE]</button>
            <button class="btn-copy">[COPY]</button>
          </div>
        `;
        
        card.querySelector('.btn-paste').addEventListener('click', () => {
          // Find reply button in the ORIGINAL tweet element
          const replyButton = tweetElement.querySelector('[data-testid="reply"]');
          if (!replyButton) return;
          
          // Check if reply box already open for this tweet
          const existingTextArea = document.querySelector('[data-testid="tweetTextarea_0"]');
          if (existingTextArea) {
            // Close any existing reply box first to avoid confusion
            const closeBtn = document.querySelector('[data-testid="app-bar-close"]') || 
                             document.querySelector('button[aria-label="Close"]');
            if (closeBtn) closeBtn.click();
            setTimeout(() => replyButton.click(), 300);
          } else {
            replyButton.click();
          }
          
          // Wait for reply box to open, then use REAL paste simulation
          let hasPasted = false;
          let attempts = 0;
          const maxAttempts = 20;
          
          const tryPaste = () => {
            if (hasPasted || attempts >= maxAttempts) return;
            attempts++;
            
            const textArea = document.querySelector('[data-testid="tweetTextarea_0"]');
            const isReplyOverlay = document.querySelector('[data-testid="ReplyComposer"]') ||
                                   document.querySelector('div[role="dialog"]');
            
            if (textArea && isReplyOverlay) {
              hasPasted = true;
              
              // Method: Fake Paste - simulate real clipboard paste event
              textArea.focus();
              
              // Create simulated Clipboard Event
              const dataTransfer = new DataTransfer();
              dataTransfer.setData('text/plain', reply);
              
              const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true
              });
              
              // Dispatch paste event - triggers X's internal onPaste
              textArea.dispatchEvent(pasteEvent);
              
              // Fallback: if paste didn't work, use execCommand
              setTimeout(() => {
                if (textArea.innerText.length < 2) {
                  document.execCommand('selectAll', false, null);
                  document.execCommand('delete', false, null);
                  document.execCommand('insertText', false, reply);
                  textArea.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }, 100);
              
              // Reply pasted to X
            } else {
              setTimeout(tryPaste, 200);
            }
          };
          
          setTimeout(tryPaste, 800);
        });
        
        card.querySelector('.btn-copy').addEventListener('click', () => {
          navigator.clipboard.writeText(reply);
          const btn = card.querySelector('.btn-copy');
          btn.textContent = '[COPIED]';
          setTimeout(() => btn.textContent = '[COPY]', 1500);
        });
        
        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
    
    regenBtn.disabled = false;
  }

  async function loadPosts(idea, container, regenBtn) {
    container.innerHTML = '<div class="loading-state">// GENERATING_POSTS...</div>';
    regenBtn.disabled = true;
    regenBtn.textContent = '[SWITCH_TO_REPLY_MODE]';
    
    try {
      const posts = await generateContent(idea, 'post');
      container.innerHTML = '';
      
      posts.forEach((post, idx) => {
        const card = document.createElement('div');
        card.className = 'reply-card';
        card.innerHTML = `
          <div class="reply-text">[POST_${String.fromCharCode(65 + idx)}]: ${post}</div>
          <div class="reply-actions">
            <button class="btn-paste">[USE]</button>
            <button class="btn-copy">[COPY]</button>
          </div>
        `;
        
        card.querySelector('.btn-paste').addEventListener('click', () => {
          const composeBtn = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
          if (!composeBtn) return;
          
          // Check if compose box already open
          const existingTextArea = document.querySelector('[data-testid="tweetTextarea_0"]');
          if (existingTextArea) {
            // Use existing compose box - Fake Paste method
            existingTextArea.focus();
            
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', post);
            
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dataTransfer,
              bubbles: true,
              cancelable: true
            });
            
            existingTextArea.dispatchEvent(pasteEvent);
            
            // Fallback
            setTimeout(() => {
              if (existingTextArea.innerText.length < 2) {
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                document.execCommand('insertText', false, post);
                existingTextArea.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }, 100);
          } else {
            // Open new compose box
            composeBtn.click();
            let hasPasted = false;
            let attempts = 0;
            
            const tryPaste = () => {
              if (hasPasted || attempts >= 20) return;
              attempts++;
              
              const textArea = document.querySelector('[data-testid="tweetTextarea_0"]');
              if (textArea) {
                hasPasted = true;
                // Fake Paste method
                textArea.focus();
                
                const dataTransfer = new DataTransfer();
                dataTransfer.setData('text/plain', post);
                
                const pasteEvent = new ClipboardEvent('paste', {
                  clipboardData: dataTransfer,
                  bubbles: true,
                  cancelable: true
                });
                
                textArea.dispatchEvent(pasteEvent);
                
                // Fallback
                setTimeout(() => {
                  if (textArea.innerText.length < 2) {
                    document.execCommand('selectAll', false, null);
                    document.execCommand('delete', false, null);
                    document.execCommand('insertText', false, post);
                    textArea.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }, 100);
              } else {
                setTimeout(tryPaste, 200);
              }
            };
            setTimeout(tryPaste, 800);
          }
        });
        
        card.querySelector('.btn-copy').addEventListener('click', () => {
          navigator.clipboard.writeText(post);
          const btn = card.querySelector('.btn-copy');
          btn.textContent = '[COPIED]';
          setTimeout(() => btn.textContent = '[COPY]', 1500);
        });
        
        container.appendChild(card);
      });
    } catch (err) {
      container.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
    
    regenBtn.disabled = false;
  }

  // PLAYBOOK DASHBOARD - Routine Manifest
  function showPlaybookDashboard() {
    if (document.querySelector('.echoreply-playbook-host')) return;
    
    const host = document.createElement('div');
    host.className = 'echoreply-playbook-host';
    host.style.cssText = 'position:fixed;z-index:999999;';
    
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .playbook-dashboard {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        background: #0a0a0a;
        border: 1px solid #222222;
        color: #e5e5e5;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        box-shadow: 0 0 60px rgba(0,0,0,0.95);
      }
      
      .playbook-header {
        background: #0a0a0a;
        border-bottom: 1px solid #222222;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .playbook-title {
        color: #f97316;
        font-size: 12px;
        letter-spacing: 1px;
      }
      
      .playbook-close {
        background: none;
        border: 1px solid #444444;
        color: #666666;
        padding: 6px 12px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 11px;
        cursor: pointer;
      }
      
      .playbook-close:hover {
        border-color: #f97316;
        color: #f97316;
      }
      
      .playbook-section {
        border-bottom: 1px solid #222222;
        padding: 20px;
      }
      
      .playbook-label {
        color: #666666;
        font-size: 10px;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }
      
      .daily-system-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      
      .system-card {
        background: #111111;
        border: 1px solid #222222;
        padding: 16px;
        text-align: center;
      }
      
      .system-card-title {
        color: #f97316;
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .playbook-rule {
        background: #111111;
        border: 1px solid #222222;
        padding: 12px 16px;
        margin-bottom: 8px;
        font-size: 11px;
        color: #e5e5e5;
      }
      
      .playbook-rule-number {
        color: #f97316;
        margin-right: 8px;
      }
      
      .data-box {
        background: #111111;
        border: 1px solid #222222;
        padding: 16px;
        font-size: 11px;
      }
      
      .data-label {
        color: #f97316;
        margin-bottom: 8px;
      }
      
      .session-info {
        color: #444444;
        font-size: 9px;
        margin-top: 12px;
        text-align: center;
      }
      
      .section-divider {
        border-top: 1px solid #222222;
        margin: 16px 0;
      }
      
      .checklist-item {
        padding: 8px 0;
        font-size: 12px;
        color: #e5e5e5;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .checklist-item .check {
        color: #f97316;
      }
      
      .checkbox-item {
        padding: 8px 0;
        font-size: 12px;
        color: #e5e5e5;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      
      .checkbox-item input[type="checkbox"] {
        appearance: none;
        width: 14px;
        height: 14px;
        border: 1px solid #444;
        background: #0a0a0a;
        cursor: pointer;
        position: relative;
      }
      
      .checkbox-item input[type="checkbox"]:checked {
        background: #f97316;
        border-color: #f97316;
      }
      
      .checkbox-item input[type="checkbox"]:checked::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: #000;
        font-size: 10px;
        font-weight: bold;
      }
      
      .section-emoji {
        font-size: 14px;
        margin-right: 6px;
      }
      
      .section-header {
        color: #f97316;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
        text-transform: uppercase;
      }
      
      .cta-text {
        color: #f97316;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
      }
      
      .tip-item {
        padding: 6px 0;
        font-size: 11px;
        color: #999;
        padding-left: 12px;
        border-left: 2px solid #333;
      }
      
      .log-entry {
        padding: 4px 0;
        font-size: 11px;
        color: #888;
        font-family: inherit;
      }
      
      .arrow-item {
        padding: 6px 0;
        font-size: 12px;
        color: #e5e5e5;
      }
      
      .motivation-text {
        font-size: 11px;
        color: #666;
        font-style: italic;
        margin-top: 8px;
      }
      
      .style-input {
        width: 100%;
        background: #111111;
        border: 1px solid #222222;
        color: #e5e5e5;
        padding: 10px 12px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 11px;
        margin-bottom: 12px;
      }
      
      .style-input:focus {
        outline: none;
        border-color: #f97316;
      }
      
      .style-textarea {
        width: 100%;
        background: #111111;
        border: 1px solid #222222;
        color: #e5e5e5;
        padding: 10px 12px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 11px;
        margin-bottom: 8px;
        min-height: 60px;
        resize: vertical;
      }
      
      .style-textarea:focus {
        outline: none;
        border-color: #f97316;
      }
      
      .style-select {
        width: 100%;
        background: #111111;
        border: 1px solid #222222;
        color: #e5e5e5;
        padding: 10px 12px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 11px;
        margin-bottom: 12px;
        cursor: pointer;
      }
      
      .style-select:focus {
        outline: none;
        border-color: #f97316;
      }
      
      .btn-save-style {
        background: #000000;
        border: 1px solid #f97316;
        color: #f97316;
        padding: 10px 16px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 10px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 8px;
      }
      
      .btn-save-style:hover {
        background: rgba(249, 115, 22, 0.1);
      }
      
      .style-status {
        color: #22c55e;
        font-size: 10px;
        margin-top: 8px;
        min-height: 14px;
      }
      
      .style-label {
        color: #666666;
        font-size: 10px;
        margin-bottom: 6px;
        display: block;
      }
    `;
    shadow.appendChild(style);
    
    const dashboard = document.createElement('div');
    dashboard.className = 'playbook-dashboard';
    dashboard.innerHTML = `
      <div class="playbook-header">
        <div class="playbook-title">////////////////////////////////////////////</div>
        <button class="playbook-close">[CLOSE]</button>
      </div>
      
      <div class="playbook-section" style="text-align: center; border-bottom: 1px solid #222;">
        <div style="color: #f97316; font-size: 13px; letter-spacing: 1px; margin-bottom: 4px;">// DAILY PLAYBOOK</div>
        <div style="color: #444; font-size: 10px;">////////////////////////////////////////////</div>
      </div>
      
      <div class="playbook-section">
        <div class="section-header"><span class="section-emoji">🔥</span>TODAY</div>
        <div class="section-divider"></div>
        <div class="checklist-item"><span class="check">✔</span> Reply to 3 posts</div>
        <div class="checklist-item"><span class="check">✔</span> Use Engagement mode once</div>
        <div class="checklist-item"><span class="check">✔</span> Post 1 idea</div>
      </div>
      
      <div class="playbook-section">
        <div class="section-header"><span class="section-emoji">✅</span>PROGRESS</div>
        <div class="section-divider"></div>
        <label class="checkbox-item"><input type="checkbox"> 1 post</label>
        <label class="checkbox-item"><input type="checkbox"> 3 replies</label>
        <label class="checkbox-item"><input type="checkbox"> spaced replies</label>
      </div>
      
      <div class="playbook-section">
        <div class="section-header"><span class="section-emoji">⚡</span>RULES</div>
        <div class="section-divider"></div>
        <div class="tip-item">• Reply to active posts</div>
        <div class="tip-item">• Add opinion (no "great post")</div>
        <div class="tip-item">• Keep it short</div>
        <div class="tip-item">• Ask questions sometimes</div>
      </div>
      
      <div class="playbook-section">
        <div class="section-header"><span class="section-emoji">�</span>REMEMBER</div>
        <div class="section-divider"></div>
        <div class="arrow-item">Better replies → more conversations → growth</div>
      </div>
      
      <div class="playbook-section" style="border-bottom: none;">
        <div class="section-header"><span class="section-emoji">🚀</span>DO THIS NOW</div>
        <div class="section-divider"></div>
        <div class="cta-text">→ Reply to one post</div>
      </div>
      
      <div class="playbook-section" style="border-top: 1px solid #222;">
        <div class="section-header">🎭 PERSONAL_STYLE_CONFIG</div>
        <div class="section-divider"></div>
        
        <span class="style-label">// ROLE</span>
        <input type="text" id="userRole" class="style-input" placeholder="Founder / Dev / Designer">
        
        <span class="style-label">// LOCATION</span>
        <input type="text" id="userLocation" class="style-input" placeholder="India / US / Remote">
        
        <span class="style-label">// TONE</span>
        <select id="userTone" class="style-select">
          <option value="">Select tone...</option>
          <option value="Witty">Witty</option>
          <option value="Direct">Direct</option>
          <option value="Technical">Technical</option>
          <option value="Casual">Casual</option>
          <option value="Sarcastic">Sarcastic</option>
          <option value="Inspirational">Inspirational</option>
        </select>
        
        <span class="style-label">// REFERENCE_TWEET_1</span>
        <textarea id="refTweet1" class="style-textarea" placeholder="Paste your best tweet here..."></textarea>
        
        <span class="style-label">// REFERENCE_TWEET_2</span>
        <textarea id="refTweet2" class="style-textarea" placeholder="Another example of your style..."></textarea>
        
        <span class="style-label">// REFERENCE_TWEET_3</span>
        <textarea id="refTweet3" class="style-textarea" placeholder="One more for the AI to learn from..."></textarea>
        
        <button class="btn-save-style" id="saveStyleBtn">[SAVE_STYLE_CONFIG]</button>
        <div class="style-status" id="styleStatus"></div>
      </div>
    `;
    
    dashboard.querySelector('.playbook-close').addEventListener('click', () => {
      host.remove();
    });
    
    // Load saved user style data
    chrome.storage.local.get(['userRole', 'userLocation', 'userTone', 'referenceTweets'], (result) => {
      if (result.userRole) dashboard.querySelector('#userRole').value = result.userRole;
      if (result.userLocation) dashboard.querySelector('#userLocation').value = result.userLocation;
      if (result.userTone) dashboard.querySelector('#userTone').value = result.userTone;
      if (result.referenceTweets) {
        dashboard.querySelector('#refTweet1').value = result.referenceTweets[0] || '';
        dashboard.querySelector('#refTweet2').value = result.referenceTweets[1] || '';
        dashboard.querySelector('#refTweet3').value = result.referenceTweets[2] || '';
      }
    });
    
    // Save style config button
    dashboard.querySelector('#saveStyleBtn').addEventListener('click', () => {
      const userRole = dashboard.querySelector('#userRole').value.trim();
      const userLocation = dashboard.querySelector('#userLocation').value.trim();
      const userTone = dashboard.querySelector('#userTone').value;
      const referenceTweets = [
        dashboard.querySelector('#refTweet1').value.trim(),
        dashboard.querySelector('#refTweet2').value.trim(),
        dashboard.querySelector('#refTweet3').value.trim()
      ].filter(t => t); // Remove empty entries
      
      chrome.storage.local.set({
        userRole,
        userLocation,
        userTone,
        referenceTweets
      }, () => {
        const statusEl = dashboard.querySelector('#styleStatus');
        statusEl.textContent = 'OK: STYLE_SAVED';
        setTimeout(() => { statusEl.textContent = ''; }, 3000);
      });
    });
    
    shadow.appendChild(dashboard);
    document.body.appendChild(host);
  }

  function findTweetArticle(element) {
    let current = element;
    while (current && current.tagName !== 'ARTICLE') {
      current = current.parentElement;
    }
    return current;
  }

  function getTweetText(article) {
    const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
    return tweetTextEl ? tweetTextEl.textContent.trim() : '';
  }

  function addReplyButtonToTweet(tweetElement) {
    if (processedTweets.has(tweetElement)) return;
    
    setTimeout(() => {
      const actionBar = tweetElement.querySelector('[role="group"]');
      if (!actionBar) return;
      
      const existingBtn = actionBar.querySelector('.echoreply-trigger-host');
      if (existingBtn) return;
      
      const tweetText = getTweetText(tweetElement);
      if (!tweetText || tweetText.length < 3) return;
      
      const host = document.createElement('div');
      host.className = 'echoreply-trigger-host';
      
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = BUTTON_STYLES;
      shadow.appendChild(style);
      
      const button = document.createElement('button');
      button.className = 'algo-trigger-btn';
      button.textContent = '[EΣ] ASSIST';
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        createBrutalistSidebar(tweetText, tweetElement);
      });
      
      shadow.appendChild(button);
      actionBar.appendChild(host);
      processedTweets.add(tweetElement);
    }, 100);
  }

  function processTweets() {
    const articles = document.querySelectorAll('article');
    let count = 0;
    
    articles.forEach(article => {
      if (!processedTweets.has(article)) {
        addReplyButtonToTweet(article);
        count++;
      }
    });
    
    if (count > 0) {
      // Tweet processing complete
    }
  }

  let debounceTimer = null;
  function debouncedProcess() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processTweets, 200);
  }

  const observer = new MutationObserver((mutations) => {
    let hasNewTweets = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && (node.tagName === 'ARTICLE' || node.querySelector?.('article'))) {
          hasNewTweets = true;
        }
      });
    });
    if (hasNewTweets) debouncedProcess();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(processTweets, 2000);
  setInterval(processTweets, 3000);

  // Twitter/X Account Connection
  function showTwitterConnect() {
    if (document.querySelector('.echoreply-connect-host')) return;
    
    const host = document.createElement('div');
    host.className = 'echoreply-connect-host';
    host.style.cssText = 'position:fixed;z-index:999999;';
    
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .connect-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        background: #0a0a0a;
        border: 1px solid #f97316;
        padding: 30px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        text-align: center;
      }
      .connect-title {
        color: #f97316;
        font-size: 16px;
        margin-bottom: 20px;
        letter-spacing: 1px;
      }
      .connect-text {
        color: #e5e5e5;
        font-size: 12px;
        line-height: 1.8;
        margin-bottom: 24px;
      }
      .connect-status {
        color: #444;
        font-size: 11px;
        margin-bottom: 20px;
        padding: 12px;
        border: 1px solid #222;
        background: #111;
      }
      .connect-status.connected {
        color: #0f0;
        border-color: #0f0;
      }
      .connect-btn {
        background: #f97316;
        border: none;
        color: #000;
        padding: 12px 24px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 12px;
        cursor: pointer;
        text-transform: uppercase;
        margin: 5px;
      }
      .connect-btn:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
      }
      .skip-link {
        color: #666;
        font-size: 10px;
        margin-top: 16px;
        cursor: pointer;
        text-decoration: underline;
      }
      .skip-link:hover {
        color: #f97316;
      }
    `;
    shadow.appendChild(style);
    
    const panel = document.createElement('div');
    panel.className = 'connect-panel';
    panel.innerHTML = `
      <div class="connect-title">// X_ACCOUNT_CONNECTION</div>
      <div class="connect-text">
        ENGAGEDLOOP needs to connect to your X/Twitter account<br>
        to provide personalized reply assistance.
      </div>
      <div class="connect-status" id="connect-status">
        STATUS: DETECTING...
      </div>
      <button class="connect-btn" id="verify-btn">[VERIFY_CONNECTION]</button>
      <button class="connect-btn" id="continue-btn" disabled>[CONTINUE_TO_DASHBOARD]</button>
      <div class="skip-link" id="skip-link">[SKIP_FOR_NOW]</div>
    `;
    
    const statusEl = panel.querySelector('#connect-status');
    const verifyBtn = panel.querySelector('#verify-btn');
    const continueBtn = panel.querySelector('#continue-btn');
    const skipLink = panel.querySelector('#skip-link');
    
    // Check if user is logged into X
    function checkXConnection() {
      const isOnX = window.location.hostname === 'x.com' || window.location.hostname === 'twitter.com';
      const hasSession = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]') || 
                          document.querySelector('[data-testid="AppTabBar_Profile_Link"]') ||
                          document.querySelector('a[href*="/home"]');
      
      if (isOnX && hasSession) {
        statusEl.textContent = 'STATUS: CONNECTED ✓';
        statusEl.classList.add('connected');
        continueBtn.disabled = false;
        verifyBtn.textContent = '[VERIFIED]';
        verifyBtn.disabled = true;
        chrome.storage.local.set({ twitterConnected: true });
        return true;
      } else {
        statusEl.textContent = 'STATUS: NOT_CONNECTED ✗';
        statusEl.style.color = '#ef4444';
        return false;
      }
    }
    
    // Auto-check on load
    setTimeout(checkXConnection, 1000);
    
    verifyBtn.addEventListener('click', () => {
      statusEl.textContent = 'STATUS: CHECKING...';
      setTimeout(checkXConnection, 1500);
    });
    
    continueBtn.addEventListener('click', () => {
      chrome.storage.local.set({ hasSeenTwitterConnect: true });
      host.remove();
      setTimeout(showOnboarding, 500);
    });
    
    skipLink.addEventListener('click', () => {
      chrome.storage.local.set({ hasSeenTwitterConnect: true });
      host.remove();
    });
    
    shadow.appendChild(panel);
    document.body.appendChild(host);
  }

  // Onboarding
  function showOnboarding() {
    if (document.querySelector('.echoreply-onboarding-host')) return;
    
    const host = document.createElement('div');
    host.className = 'echoreply-onboarding-host';
    host.style.cssText = 'position:fixed;z-index:999999;';
    
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .onboarding-panel {
        position: fixed;
        top: 80px;
        right: 360px;
        width: 300px;
        background: #0a0a0a;
        border: 1px solid #f97316;
        padding: 20px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
      }
      .onboarding-title {
        color: #f97316;
        font-size: 14px;
        margin-bottom: 12px;
      }
      .onboarding-text {
        color: #e5e5e5;
        font-size: 12px;
        line-height: 1.6;
        margin-bottom: 16px;
      }
      .onboarding-btn {
        background: #f97316;
        border: none;
        color: #000;
        padding: 8px 16px;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 11px;
        cursor: pointer;
        text-transform: uppercase;
      }
    `;
    shadow.appendChild(style);
    
    const panel = document.createElement('div');
    panel.className = 'onboarding-panel';
    panel.innerHTML = `
      <div class="onboarding-title">// SYSTEM_INIT v1.0</div>
      <div class="onboarding-text">
        Welcome to ENGAGEDLOOP<br><br>
        1. Click [EΣ] ASSIST on any tweet<br>
        2. Select draft reply<br>
        3. Edit before posting<br>
        4. Stay under daily limit<br><br>
        LIMIT: ${userProfile?.is_pro ? 30 : 3}/day ${userProfile?.is_pro ? '⭐ PRO TIER' : '(Free Tier: 3/day | Upgrade for 30/day)'}
      </div>
      <button class="onboarding-btn">[ACKNOWLEDGE]</button>
    `;
    
    panel.querySelector('.onboarding-btn').addEventListener('click', () => {
      chrome.storage.local.set({ hasSeenOnboarding: true });
      host.remove();
    });
    
    shadow.appendChild(panel);
    document.body.appendChild(host);
  }

  // Extension initialized
})();
