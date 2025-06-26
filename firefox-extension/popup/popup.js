// Popup JavaScript for Sensitive Data Obfuscator Extension

class PopupController {
  constructor() {
    this.settings = null;
    this.currentTab = null;
    this.isAdvancedMode = false;
    
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();
    
    // Get current tab info
    await this.getCurrentTab();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
    
    console.log('Popup initialized');
  }

  async loadSettings() {
    try {
      // Firefox uses browser.runtime instead of chrome.runtime
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        this.settings = response.settings;
      } else {
        console.error('Failed to load settings:', response.error);
        this.settings = this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  async getCurrentTab() {
    try {
      // Firefox uses browser.tabs instead of chrome.tabs
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        this.currentTab = tabs[0];
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  getDefaultSettings() {
    return {
      enabled: true,
      simpleMode: true,
      patterns: {
        creditCard: { enabled: true },
        phone: { enabled: true },
        email: { enabled: true },
        ssn: { enabled: true },
        sin: { enabled: true },
        ipAddress: { enabled: true },
        name: { enabled: false }
      },
      llmSites: [
        'chat.openai.com',
        'claude.ai',
        'bard.google.com',
        'bing.com',
        'you.com',
        'perplexity.ai'
      ],
      autoDetectLLM: true,
      customPatterns: {}
    };
  }

  setupEventListeners() {
    // Main toggle
    const mainToggle = document.getElementById('mainToggle');
    mainToggle.addEventListener('change', (e) => {
      this.updateSetting('enabled', e.target.checked);
    });

    // Simple config toggles
    const simpleToggles = {
      'creditCardToggle': 'creditCard',
      'phoneToggle': 'phone',
      'emailToggle': 'email',
      'ssnToggle': 'ssn'
    };

    Object.entries(simpleToggles).forEach(([elementId, patternKey]) => {
      const element = document.getElementById(elementId);
      element.addEventListener('change', (e) => {
        this.updatePatternSetting(patternKey, 'enabled', e.target.checked);
      });
    });

    // Advanced configuration toggle
    const advancedBtn = document.getElementById('advancedBtn');
    advancedBtn.addEventListener('click', () => {
      this.toggleAdvancedMode();
    });

    // Auto-detect toggle
    const autoDetectToggle = document.getElementById('autoDetectToggle');
    autoDetectToggle.addEventListener('change', (e) => {
      this.updateSetting('autoDetectLLM', e.target.checked);
    });

    // DLP options
    const luhnValidation = document.getElementById('luhnValidation');
    luhnValidation.addEventListener('change', (e) => {
      this.updatePatternSetting('creditCard', 'useAdvancedValidation', e.target.checked);
    });

    // Site management
    const addSiteBtn = document.getElementById('addSiteBtn');
    addSiteBtn.addEventListener('click', () => {
      this.showAddSiteModal();
    });

    // Pattern management
    const addPatternBtn = document.getElementById('addPatternBtn');
    addPatternBtn.addEventListener('click', () => {
      this.showAddPatternModal();
    });

    // Settings actions
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', () => {
      this.exportSettings();
    });

    const importBtn = document.getElementById('importBtn');
    importBtn.addEventListener('click', () => {
      this.importSettings();
    });

    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
      this.resetSettings();
    });

    // Modal event listeners
    this.setupModalEventListeners();
  }

  setupModalEventListeners() {
    // Add Site Modal
    const addSiteModal = document.getElementById('addSiteModal');
    const closeSiteModal = document.getElementById('closeSiteModal');
    const cancelSiteAdd = document.getElementById('cancelSiteAdd');
    const confirmSiteAdd = document.getElementById('confirmSiteAdd');

    [closeSiteModal, cancelSiteAdd].forEach(btn => {
      btn.addEventListener('click', () => {
        addSiteModal.style.display = 'none';
      });
    });

    confirmSiteAdd.addEventListener('click', () => {
      this.addSite();
    });

    // Add Pattern Modal
    const addPatternModal = document.getElementById('addPatternModal');
    const closePatternModal = document.getElementById('closePatternModal');
    const cancelPatternAdd = document.getElementById('cancelPatternAdd');
    const confirmPatternAdd = document.getElementById('confirmPatternAdd');

    [closePatternModal, cancelPatternAdd].forEach(btn => {
      btn.addEventListener('click', () => {
        addPatternModal.style.display = 'none';
      });
    });

    confirmPatternAdd.addEventListener('click', () => {
      this.addPattern();
    });

    // Close modals when clicking outside
    [addSiteModal, addPatternModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });
  }

  updateUI() {
    this.updateMainToggle();
    this.updateSiteStatus();
    this.updateSimpleConfig();
    this.updateAdvancedConfig();
  }

  updateMainToggle() {
    const mainToggle = document.getElementById('mainToggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const protectionDescription = document.getElementById('protectionDescription');

    mainToggle.checked = this.settings.enabled;
    
    if (this.settings.enabled) {
      statusText.textContent = 'Active';
      statusIndicator.className = 'status-indicator active';
      protectionDescription.textContent = 'Automatically obfuscate sensitive data when pasting into LLM platforms';
    } else {
      statusText.textContent = 'Disabled';
      statusIndicator.className = 'status-indicator disabled';
      protectionDescription.textContent = 'Protection is currently disabled';
    }
  }

  async updateSiteStatus() {
    const siteName = document.getElementById('siteName');
    const siteDescription = document.getElementById('siteDescription');
    const siteBadge = document.getElementById('siteBadge');

    if (!this.currentTab || !this.currentTab.url) {
      siteName.textContent = 'Unknown Site';
      siteDescription.textContent = 'Unable to determine current site';
      siteBadge.innerHTML = '<span>Unknown</span>';
      siteBadge.className = 'site-badge unknown';
      return;
    }

    try {
      const url = new URL(this.currentTab.url);
      const hostname = url.hostname;
      
      siteName.textContent = hostname;
      
      // Check if it's an LLM site - Firefox uses browser.runtime
      const response = await browser.runtime.sendMessage({
        type: 'CHECK_LLM_SITE',
        url: this.currentTab.url
      });

      if (response.success && response.isLLMSite) {
        siteDescription.textContent = 'LLM platform detected';
        siteBadge.innerHTML = '<span>Protected</span>';
        siteBadge.className = 'site-badge protected';
      } else {
        siteDescription.textContent = 'Regular website';
        siteBadge.innerHTML = '<span>Not monitored</span>';
        siteBadge.className = 'site-badge unknown';
      }
    } catch (error) {
      console.error('Error updating site status:', error);
      siteName.textContent = 'Error';
      siteDescription.textContent = 'Unable to check site status';
      siteBadge.innerHTML = '<span>Error</span>';
      siteBadge.className = 'site-badge unknown';
    }
  }

  updateSimpleConfig() {
    const toggles = {
      'creditCardToggle': 'creditCard',
      'phoneToggle': 'phone',
      'emailToggle': 'email',
      'ssnToggle': 'ssn'
    };

    Object.entries(toggles).forEach(([elementId, patternKey]) => {
      const element = document.getElementById(elementId);
      element.checked = this.settings.patterns[patternKey]?.enabled || false;
    });
  }

  updateAdvancedConfig() {
    // Auto-detect toggle
    const autoDetectToggle = document.getElementById('autoDetectToggle');
    autoDetectToggle.checked = this.settings.autoDetectLLM;

    // Luhn validation
    const luhnValidation = document.getElementById('luhnValidation');
    luhnValidation.checked = this.settings.patterns.creditCard?.useAdvancedValidation || false;

    // Update sites list
    this.updateSitesList();
    
    // Update patterns list
    this.updatePatternsList();
  }

  updateSitesList() {
    const sitesContainer = document.getElementById('sitesContainer');
    sitesContainer.innerHTML = '';

    this.settings.llmSites.forEach((site, index) => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      siteItem.innerHTML = `
        <span class="site-url">${site}</span>
        <button class="remove-site" data-index="${index}">×</button>
      `;
      
      const removeBtn = siteItem.querySelector('.remove-site');
      removeBtn.addEventListener('click', () => {
        this.removeSite(index);
      });
      
      sitesContainer.appendChild(siteItem);
    });
  }

  updatePatternsList() {
    const patternsList = document.getElementById('patternsList');
    patternsList.innerHTML = '';

    const allPatterns = { ...this.settings.patterns, ...this.settings.customPatterns };

    Object.entries(allPatterns).forEach(([key, pattern]) => {
      const patternItem = document.createElement('div');
      patternItem.className = 'pattern-item';
      
      const isCustom = this.settings.customPatterns[key] !== undefined;
      
      patternItem.innerHTML = `
        <div class="pattern-info">
          <div class="pattern-name">${pattern.name || key}</div>
          <div class="pattern-regex">${pattern.regex ? pattern.regex.source || pattern.regex : 'N/A'}</div>
        </div>
        <div class="pattern-controls">
          <label class="switch pattern-toggle">
            <input type="checkbox" ${pattern.enabled ? 'checked' : ''} data-pattern="${key}">
            <span class="slider"></span>
          </label>
          ${isCustom ? `<button class="remove-pattern" data-pattern="${key}">×</button>` : ''}
        </div>
      `;
      
      const toggle = patternItem.querySelector('input[type="checkbox"]');
      toggle.addEventListener('change', (e) => {
        this.updatePatternSetting(key, 'enabled', e.target.checked);
      });
      
      const removeBtn = patternItem.querySelector('.remove-pattern');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          this.removePattern(key);
        });
      }
      
      patternsList.appendChild(patternItem);
    });
  }

  toggleAdvancedMode() {
    const advancedConfig = document.getElementById('advancedConfig');
    const advancedBtn = document.getElementById('advancedBtn');
    
    this.isAdvancedMode = !this.isAdvancedMode;
    
    if (this.isAdvancedMode) {
      advancedConfig.style.display = 'block';
      advancedBtn.classList.add('expanded');
    } else {
      advancedConfig.style.display = 'none';
      advancedBtn.classList.remove('expanded');
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.saveSettings();
    this.updateUI();
  }

  async updatePatternSetting(patternKey, settingKey, value) {
    if (!this.settings.patterns[patternKey]) {
      this.settings.patterns[patternKey] = {};
    }
    this.settings.patterns[patternKey][settingKey] = value;
    await this.saveSettings();
    this.updateUI();
  }

  async saveSettings() {
    try {
      // Firefox uses browser.runtime instead of chrome.runtime
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: this.settings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  showAddSiteModal() {
    const modal = document.getElementById('addSiteModal');
    const input = document.getElementById('siteUrl');
    input.value = '';
    modal.style.display = 'flex';
    input.focus();
  }

  async addSite() {
    const input = document.getElementById('siteUrl');
    const url = input.value.trim();
    
    if (!url) return;
    
    // Clean up the URL (remove protocol, www, etc.)
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    if (!this.settings.llmSites.includes(cleanUrl)) {
      this.settings.llmSites.push(cleanUrl);
      await this.saveSettings();
      this.updateSitesList();
    }
    
    document.getElementById('addSiteModal').style.display = 'none';
  }

  async removeSite(index) {
    this.settings.llmSites.splice(index, 1);
    await this.saveSettings();
    this.updateSitesList();
  }

  showAddPatternModal() {
    const modal = document.getElementById('addPatternModal');
    document.getElementById('patternName').value = '';
    document.getElementById('patternRegex').value = '';
    document.getElementById('patternReplacement').value = '';
    modal.style.display = 'flex';
    document.getElementById('patternName').focus();
  }

  async addPattern() {
    const name = document.getElementById('patternName').value.trim();
    const regex = document.getElementById('patternRegex').value.trim();
    const replacement = document.getElementById('patternReplacement').value.trim();
    
    if (!name || !regex || !replacement) return;
    
    try {
      // Test the regex
      new RegExp(regex);
      
      const key = name.toLowerCase().replace(/\s+/g, '_');
      this.settings.customPatterns[key] = {
        name: name,
        regex: regex,
        replacement: replacement,
        enabled: true,
        useAdvancedValidation: false
      };
      
      await this.saveSettings();
      this.updatePatternsList();
      document.getElementById('addPatternModal').style.display = 'none';
    } catch (error) {
      alert('Invalid regular expression. Please check your pattern.');
    }
  }

  async removePattern(key) {
    if (confirm('Are you sure you want to remove this pattern?')) {
      delete this.settings.customPatterns[key];
      await this.saveSettings();
      this.updatePatternsList();
    }
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sensitive-data-obfuscator-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          this.settings = { ...this.getDefaultSettings(), ...importedSettings };
          await this.saveSettings();
          this.updateUI();
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      this.updateUI();
      alert('Settings reset to defaults.');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

