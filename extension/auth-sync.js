// auth-sync.js
// This script runs on engagedloop.vercel.app and syncs the Supabase session to the Chrome Extension

console.log("[ENGAGEDLOOP] Auth Sync Script Injected");

// Listen for messages from the web page
window.addEventListener("message", function(event) {
  // Only accept messages from our own domain
  if (event.source !== window) return;

  if (event.data.type && event.data.type === "ENGAGEDLOOP_AUTH_SYNC") {
    console.log("[ENGAGEDLOOP] Received auth data from web app, syncing to extension...");
    
    // Save to extension's local storage
    chrome.storage.local.set({
      supabaseUser: event.data.user ? event.data.user.email : null,
      isPro: event.data.profile ? event.data.profile.is_pro : false,
      preferredTone: event.data.profile ? event.data.profile.preferred_tone : 'casual'
    }, function() {
      console.log("[ENGAGEDLOOP] Extension successfully synced with web session!");
      
      // Tell the web page we succeeded
      window.postMessage({ type: "ENGAGEDLOOP_AUTH_SYNC_SUCCESS" }, "*");
    });
  }
});
