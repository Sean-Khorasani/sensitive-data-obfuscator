// Background service worker for Sensitive Data Obfuscator extension

// Import obfuscation patterns and advanced DLP
importScripts('obfuscation-patterns.js');
importScripts('advanced-dlp.js');

class BackgroundService {
  constructor() {
    this.obfuscationPatterns = new ObfuscationPatterns();
    this.advancedDLP = new AdvancedDLP();
    this.settings = {
      enabled: true,
      simpleMode: true,
      patterns: this.obfuscationPatterns.getDefaultPatterns(),
      llmSites: this.obfuscationPatterns.getDefaultLLMSites(),
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
    
    console.log('Sensitive Data Obfuscator: Background service initialized');
  }

  setupEventListeners() {
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async response
    });

    // Listen for tab updates to detect LLM sites
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Listen for extension installation/startup
    chrome.runtime.onStartup.addListener(() => {
      this.loadSettings();
    });

    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'OBFUSCATE_TEXT':
          const obfuscatedText = await this.obfuscateText(message.text, message.url);
          sendResponse({ success: true, obfuscatedText });
          break;

        case 'GET_SETTINGS':
          sendResponse({ success: true, settings: this.settings });
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'CHECK_LLM_SITE':
          const isLLM = this.isLLMSite(message.url);
          sendResponse({ success: true, isLLMSite: isLLM });
          break;

        case 'GET_SITE_STATUS':
          const siteStatus = await this.getSiteStatus(sender.tab);
          sendResponse({ success: true, status: siteStatus });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ success: false, error: error.message });
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
      console.error('Error handling tab update:', error);
    }
  }

  async handleFirstInstall() {
    // Set default settings on first install
    await this.saveSettings();
    
    // Open welcome/setup page
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/popup.html')
    });
  }

  async obfuscateText(text, url) {
    if (!this.settings.enabled) {
      return text;
    }

    // Check if current site should be processed
    if (url && !this.shouldProcessSite(url)) {
      return text;
    }

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
      
      return this.advancedDLP.processText(text, dlpSettings);
    } else {
      // Use basic obfuscation for simple mode
      const patterns = { ...this.settings.patterns, ...this.settings.customPatterns };
      return this.obfuscationPatterns.obfuscateText(text, patterns);
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
      console.error('Error checking site:', error);
      return false;
    }
  }

  isLLMSite(hostname) {
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
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to local storage
      try {
        const localResult = await chrome.storage.local.get(['settings']);
        if (localResult.settings) {
          this.settings = { ...this.settings, ...localResult.settings };
        }
      } catch (localError) {
        console.error('Error loading local settings:', localError);
      }
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Error saving to sync storage:', error);
      // Fallback to local storage
      try {
        await chrome.storage.local.set({ settings: this.settings });
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Notify all content scripts about settings update
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
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

