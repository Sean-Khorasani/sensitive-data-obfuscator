// Background script for Sensitive Data Obfuscator Firefox extension (Manifest V2)

// Import obfuscation patterns and advanced DLP
// Note: Firefox doesn't use importScripts in the same way, so we'll inline the functionality

class ObfuscationPatterns {
  constructor() {
    this.defaultPatterns = {
      creditCard: {
        enabled: true,
        regex: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/g,
        replacement: 'XXXX-XXXX-XXXX-XXXX',
        description: 'Credit card numbers'
      },
      ssn: {
        enabled: true,
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        replacement: 'XXX-XX-XXXX',
        description: 'Social Security Numbers'
      },
      email: {
        enabled: true,
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: 'user@example.com',
        description: 'Email addresses'
      },
      phone: {
        enabled: true,
        regex: /\b(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?[\d]{2,4}\)?[-.\s]?){2,4}[\d]{2,4}\b/g,
        replacement: 'XXX-XXX-XXXX',
        description: 'Phone numbers'
      },
      accountNumber: {
        enabled: true,
        regex: /\b\d{7,17}\b/g,
        replacement: 'XXXXXXXXX',
        description: 'Account numbers'
      }
    };
  }

  getDefaultPatterns() {
    return this.defaultPatterns;
  }

  obfuscateText(text, patterns) {
    let processedText = text;
    
    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.enabled && pattern.regex) {
        const matches = processedText.match(pattern.regex);
        if (matches) {
          console.log(`Firefox DLP: Found ${pattern.description}:`, matches.length, 'instances');
          processedText = processedText.replace(pattern.regex, pattern.replacement);
        }
      }
    });
    
    return processedText;
  }

  isLLMSite(hostname) {
    const llmSites = ['claude.ai', 'chat.openai.com', 'chatgpt.com', 'bard.google.com', 'gemini.google.com', 'bing.com', 'you.com', 'perplexity.ai'];
    return llmSites.some(site => hostname.includes(site));
  }
}

class AdvancedDLP {
  processText(text, settings) {
    // Simplified advanced DLP for Firefox
    const patterns = new ObfuscationPatterns();
    return patterns.obfuscateText(text, patterns.getDefaultPatterns());
  }
}

class BackgroundService {
  constructor() {
    this.obfuscationPatterns = new ObfuscationPatterns();
    this.advancedDLP = new AdvancedDLP();
    this.settings = {
      enabled: true,
      simpleMode: true,
      patterns: this.obfuscationPatterns.getDefaultPatterns(),
      llmSites: ['claude.ai', 'chat.openai.com', 'chatgpt.com', 'bard.google.com', 'gemini.google.com', 'bing.com', 'you.com', 'perplexity.ai'],
      autoDetectLLM: true,
      customPatterns: {},
      useContextualAnalysis: false,
      strictMode: false,
      obfuscationMode: 'substitute'
    };
    
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Firefox Sensitive Data Obfuscator: Background service initialized');
  }

  setupEventListeners() {
    // Listen for messages from content scripts and popup
    browser.runtime.onMessage.addListener((message, sender) => {
      return this.handleMessage(message, sender);
    });

    // Listen for tab updates to detect LLM sites
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Listen for extension installation/startup
    browser.runtime.onStartup.addListener(() => {
      this.loadSettings();
    });

    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  async handleMessage(message, sender) {
    console.log('Firefox Background: Received message:', message.type);
    
    try {
      switch (message.type) {
        case 'OBFUSCATE_TEXT':
          console.log('Firefox Background: Processing OBFUSCATE_TEXT request');
          const obfuscatedText = await this.obfuscateText(message.text, message.url);
          console.log('Firefox Background: Sending obfuscated response');
          return { success: true, obfuscatedText };

        case 'GET_SETTINGS':
          return { success: true, settings: this.settings };

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          return { success: true };

        case 'CHECK_LLM_SITE':
          const isLLM = this.isLLMSite(message.url);
          return { success: true, isLLMSite: isLLM };

        case 'GET_SITE_STATUS':
          const siteStatus = await this.getSiteStatus(sender.tab);
          return { success: true, status: siteStatus };

        default:
          return { success: false, error: 'Unknown message type' };
      }
    } catch (error) {
      console.error('Firefox Background service error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleTabUpdate(tabId, tab) {
    if (!this.settings.enabled || !this.settings.autoDetectLLM) return;

    try {
      const url = new URL(tab.url);
      const isLLM = this.isLLMSite(url.hostname);
      // The content script is already declared in manifest.json to run on all URLs.
      // It will handle its own activation based on isLLMSite status.
    } catch (error) {
      console.error('Firefox: Error handling tab update:', error);
    }
  }

  async handleFirstInstall() {
    // Set default settings on first install
    await this.saveSettings();
    
    // Open welcome/setup page
    browser.tabs.create({
      url: browser.runtime.getURL('popup/popup.html')
    });
  }

  async obfuscateText(text, url) {
    console.log('Firefox Background: obfuscateText called, enabled:', this.settings.enabled);
    
    if (!this.settings.enabled) {
      console.log('Firefox Background: Extension disabled, returning original text');
      return text;
    }

    // Check if current site should be processed
    if (url && !this.shouldProcessSite(url)) {
      console.log('Firefox Background: Site should not be processed:', url);
      return text;
    }
    
    console.log('Firefox Background: Processing text, simple mode:', this.settings.simpleMode);

    // Use advanced DLP if available and configured
    if (this.advancedDLP && !this.settings.simpleMode) {
      const dlpSettings = {
        useLuhnValidation: this.settings.patterns.creditCard?.useAdvancedValidation || false,
        useContextualAnalysis: this.settings.useContextualAnalysis || false,
        strictMode: this.settings.strictMode || false,
        detectNames: this.settings.patterns.name?.enabled || false,
        obfuscationMode: this.settings.obfuscationMode || 'substitute',
        enabledTypes: this.getEnabledTypes()
      };
      
      console.log('Firefox Background: Using advanced DLP');
      const result = this.advancedDLP.processText(text, dlpSettings);
      console.log('Firefox Background: Advanced DLP result length:', result.length);
      return result;
    } else {
      // Use basic obfuscation for simple mode
      console.log('Firefox Background: Using basic obfuscation patterns');
      const patterns = { ...this.settings.patterns, ...this.settings.customPatterns };
      const result = this.obfuscationPatterns.obfuscateText(text, patterns);
      console.log('Firefox Background: Basic obfuscation result preview:', result.substring(0, 200) + '...');
      return result;
    }
  }

  getEnabledTypes() {
    const enabledTypes = [];
    Object.entries(this.settings.patterns).forEach(([key, pattern]) => {
      if (pattern.enabled) {
        enabledTypes.push(key);
      }
    });
    return enabledTypes;
  }

  shouldProcessSite(url) {
    try {
      const hostname = new URL(url).hostname;
      
      if (this.settings.autoDetectLLM) {
        return this.isLLMSite(hostname);
      } else {
        // Check against user-defined LLM sites list
        return this.settings.llmSites.some(site => 
          hostname.includes(site) || hostname.endsWith(site)
        );
      }
    } catch (error) {
      console.error('Firefox: Error checking site:', error);
      return false;
    }
  }

  isLLMSite(hostname) {
    if (!hostname || !this.settings.llmSites) return false;
    
    return this.obfuscationPatterns.isLLMSite(hostname) || 
           this.settings.llmSites.some(site => 
             hostname.includes(site) || hostname.endsWith(site)
           );
  }

  async getSiteStatus(tab) {
    if (!tab || !tab.url) {
      return { isLLMSite: false, enabled: this.settings.enabled };
    }

    const url = new URL(tab.url);
    const isLLM = this.isLLMSite(url.hostname);
    
    return {
      isLLMSite: isLLM,
      enabled: this.settings.enabled,
      shouldProcess: this.shouldProcessSite(tab.url)
    };
  }

  async loadSettings() {
    try {
      const result = await browser.storage.sync.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Firefox: Error loading settings:', error);
      // Fallback to local storage
      try {
        const localResult = await browser.storage.local.get(['settings']);
        if (localResult.settings) {
          this.settings = { ...this.settings, ...localResult.settings };
        }
      } catch (localError) {
        console.error('Firefox: Error loading local settings:', localError);
      }
    }
  }

  async saveSettings() {
    try {
      await browser.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Firefox: Error saving to sync storage:', error);
      // Fallback to local storage
      try {
        await browser.storage.local.set({ settings: this.settings });
      } catch (localError) {
        console.error('Firefox: Error saving to local storage:', localError);
      }
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Notify all content scripts about settings update
    const tabs = await browser.tabs.query({});
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings: this.settings
      }).catch(() => {
        // Ignore errors for tabs without content scripts
      });
    });
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();