document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const usageSection = document.getElementById('usageSection');
  const usageCountEl = document.getElementById('usageCount');
  const usageFill = document.getElementById('usageFill');
  const upgradeBtn = document.getElementById('upgradeBtn');

  const DEFAULT_LIMIT = 3; // Free tier default

  let userLimit = DEFAULT_LIMIT;
  let isConnected = false;

  chrome.storage.local.get(['apiKey', 'usageCount', 'lastResetDate', 'supabaseUser', 'isPro'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      usageSection.classList.remove('hidden');
    }
    
    // Check for Supabase data
    if (result.supabaseUser) {
      isConnected = true;
      userLimit = result.isPro ? 30 : 3;
    }
    
    updateUsageDisplay(result.usageCount || 0);
  });

  function updateUsageDisplay(count) {
    const percentage = (count / userLimit) * 100;
    const limitText = isConnected ? (userLimit === 30 ? '30 ⭐ PRO' : '3') : `${userLimit} (local)`;
    usageCountEl.textContent = `${String(count).padStart(3, '0')}/${limitText}`;
    usageFill.style.width = `${percentage}%`;
    
    if (count >= userLimit * 0.8) {
      usageCountEl.classList.add('warning');
      usageFill.classList.add('warning');
    } else {
      usageCountEl.classList.remove('warning');
      usageFill.classList.remove('warning');
    }
  }

  function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }, 3000);
  }

  saveBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('ERR: API_KEY_REQUIRED', true);
      return;
    }

    chrome.storage.local.set({ apiKey: apiKey }, function() {
      showStatus('OK: CONFIG_SAVED');
      usageSection.classList.remove('hidden');
    });
  });

  upgradeBtn.addEventListener('click', function() {
    alert('PREMIUM_TIER:\n\nEarly Access: ₹99 (one-time)\n\nUnlock unlimited generations\nPriority support\nCustom prompts\n\nComing soon...');
  });
});
