// Content script for Sensitive Data Obfuscator extension

class ContentScriptHandler {
  constructor() {
    this.isEnabled = true;
    this.isLLMSite = false;
    this.settings = null;
    this.processingPaste = false;
    
    this.init();
  }

  async init() {
    // Check if this is an LLM site
    await this.checkSiteStatus();
    
    if (this.isLLMSite && this.isEnabled) {
      this.setupEventListeners();
      console.log("Sensitive Data Obfuscator: Content script active on LLM site. URL: " + window.location.href);
    } else {
      console.log("Sensitive Data Obfuscator: Content script NOT active. isLLMSite: " + this.isLLMSite + ", isEnabled: " + this.isEnabled + ", URL: " + window.location.href);
    }

    // Listen for settings updates from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  async checkSiteStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SITE_STATUS'
      });
      
      if (response.success) {
        this.isLLMSite = response.status.isLLMSite;
        this.isEnabled = response.status.enabled;
        this.shouldProcess = response.status.shouldProcess;
      }
    } catch (error) {
      console.error('Error checking site status:', error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SETTINGS_UPDATED':
        this.settings = message.settings;
        this.isEnabled = message.settings.enabled;
        
        // Re-setup event listeners if needed
        if (this.isLLMSite && this.isEnabled && !this.listenersSetup) {
          this.setupEventListeners();
        }
        break;
    }
  }

  setupEventListeners() {
    if (this.listenersSetup) return;
    
    // Listen for paste events on the entire document
    document.addEventListener('paste', (event) => {
      this.handlePasteEvent(event);
    }, true);

    // Listen for input events to catch programmatic pastes
    document.addEventListener('input', (event) => {
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertText') {
        this.handleInputEvent(event);
      }
    }, true);

    // Listen for keydown events for Ctrl+V detection
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        this.handleKeyboardPaste(event);
      }
    }, true);

    this.listenersSetup = true;
  }

  async handlePasteEvent(event) {
    if (!this.shouldProcessEvent(event)) return;

    try {
      this.processingPaste = true;
      
      // Get clipboard data
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText || pastedText.trim().length === 0) return;

      // Check if text contains sensitive information
      if (!this.containsSensitiveData(pastedText)) return;

      // Prevent default paste behavior
      event.preventDefault();
      event.stopPropagation();

      // Obfuscate the text
      const obfuscatedText = await this.obfuscateText(pastedText);
      
      // Insert obfuscated text
      this.insertObfuscatedText(event.target, obfuscatedText);
      
      // Show notification (optional)
      this.showObfuscationNotification();
      
    } catch (error) {
      console.error('Error handling paste event:', error);
    } finally {
      this.processingPaste = false;
    }
  }

  async handleInputEvent(event) {
    if (!this.shouldProcessEvent(event) || this.processingPaste) return;

    // This handles cases where paste might not trigger the paste event
    const target = event.target;
    if (!target.value) return;

    // Check if the input contains sensitive data
    if (this.containsSensitiveData(target.value)) {
      const obfuscatedText = await this.obfuscateText(target.value);
      if (obfuscatedText !== target.value) {
        target.value = obfuscatedText;
        this.showObfuscationNotification();
      }
    }
  }

  async handleKeyboardPaste(event) {
    // This is a fallback for keyboard paste detection
    if (!this.shouldProcessEvent(event)) return;

    // Wait a bit for the paste to complete, then check the content
    setTimeout(async () => {
      const target = event.target;
      if (target && target.value && this.containsSensitiveData(target.value)) {
        const obfuscatedText = await this.obfuscateText(target.value);
        if (obfuscatedText !== target.value) {
          target.value = obfuscatedText;
          this.showObfuscationNotification();
        }
      }
    }, 10);
  }

  shouldProcessEvent(event) {
    if (!this.isEnabled || !this.isLLMSite) return false;

    const target = event.target;
    if (!target) return false;

    // Check if target is an input element
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true' ||
                          target.isContentEditable;

    if (!isInputElement) return false;

    // Skip password fields and other sensitive input types
    if (target.type === 'password' || target.type === 'hidden') return false;

    return true;
  }

  containsSensitiveData(text) {
    // Quick check for common sensitive data patterns
    const quickPatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/ // Phone
    ];

    return quickPatterns.some(pattern => pattern.test(text));
  }

  async obfuscateText(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'OBFUSCATE_TEXT',
        text: text,
        url: window.location.href
      });

      if (response.success) {
        return response.obfuscatedText;
      } else {
        console.error('Error obfuscating text:', response.error);
        return text;
      }
    } catch (error) {
      console.error('Error communicating with background script:', error);
      return text;
    }
  }

  insertObfuscatedText(target, text) {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // For input and textarea elements
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      
      target.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      
      // Restore cursor position
      const newPosition = start + text.length;
      target.setSelectionRange(newPosition, newPosition);
      
      // Trigger input event
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (target.contentEditable === 'true' || target.isContentEditable) {
      // For contentEditable elements
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        target.textContent += text;
      }
      
      // Trigger input event
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  showObfuscationNotification() {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
    `;
    notification.textContent = '🔒 Sensitive data obfuscated';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize content script only if we're in a proper window context
if (typeof window !== 'undefined' && window.location && !window.sensitiveDataObfuscatorContentHandler) {
  window.sensitiveDataObfuscatorContentHandler = new ContentScriptHandler();
}

