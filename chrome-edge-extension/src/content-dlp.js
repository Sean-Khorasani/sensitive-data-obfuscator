// Enterprise DLP-style Content Script for Sensitive Data Obfuscator

class EnterpriseDLP {
  constructor() {
    this.isEnabled = true;
    this.isLLMSite = false;
    this.isProcessing = false;
    
    // Sensitive data patterns
    this.patterns = [
      { name: 'Credit Card', regex: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/g, replacement: 'XXXX-XXXX-XXXX-XXXX' },
      { name: 'SSN', regex: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: 'XXX-XX-XXXX' },
      { name: 'Phone', regex: /\b(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?[\d]{2,4}\)?[-.\s]?){2,4}[\d]{2,4}\b/g, replacement: 'XXX-XXX-XXXX' },
      { name: 'Email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: 'user@example.com' },
      { name: 'Account Number', regex: /\b\d{7,17}\b/g, replacement: 'XXXXXXXXX' }
    ];
    
    this.init();
  }

  async init() {
    await this.checkSiteStatus();
    
    if (this.isLLMSite && this.isEnabled) {
      console.log('Enterprise DLP: Initializing on LLM site');
      this.interceptClipboard();
      this.setupMutationObserver();
      this.setupInputMonitoring();
    }
  }

  async checkSiteStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SITE_STATUS' });
      if (response && response.success) {
        this.isLLMSite = response.status.isLLMSite;
        this.isEnabled = response.status.enabled;
      } else {
        // Fallback detection
        this.isLLMSite = this.detectLLMSite();
        this.isEnabled = true;
      }
    } catch (error) {
      console.log('Enterprise DLP: Using fallback site detection');
      this.isLLMSite = this.detectLLMSite();
      this.isEnabled = true;
    }
  }

  detectLLMSite() {
    const hostname = window.location.hostname;
    const llmSites = ['claude.ai', 'chat.openai.com', 'bard.google.com', 'bing.com', 'you.com', 'perplexity.ai'];
    return llmSites.some(site => hostname.includes(site));
  }

  // Approach 1: Clipboard API Interception (Enterprise DLP Standard)
  interceptClipboard() {
    console.log('Enterprise DLP: Setting up clipboard interception');

    // Override navigator.clipboard.readText
    if (navigator.clipboard && navigator.clipboard.readText) {
      const originalReadText = navigator.clipboard.readText.bind(navigator.clipboard);
      navigator.clipboard.readText = async () => {
        try {
          const text = await originalReadText();
          return this.processText(text);
        } catch (error) {
          console.log('Enterprise DLP: Clipboard read error:', error);
          return '';
        }
      };
    }

    // Override document.execCommand for older browsers
    const originalExecCommand = document.execCommand.bind(document);
    document.execCommand = (command, showDefaultUI, value) => {
      if (command === 'paste') {
        console.log('Enterprise DLP: Intercepted execCommand paste');
        return this.handleLegacyPaste(originalExecCommand, showDefaultUI, value);
      }
      return originalExecCommand(command, showDefaultUI, value);
    };

    // Listen for clipboard events at document level
    document.addEventListener('paste', (event) => this.handleClipboardEvent(event), true);
  }

  async handleClipboardEvent(event) {
    if (this.isProcessing) return;
    
    console.log('Enterprise DLP: Clipboard event intercepted');
    
    try {
      this.isProcessing = true;
      
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const originalText = clipboardData.getData('text/plain');
      if (!originalText) return;

      const processedText = this.processText(originalText);
      
      if (processedText !== originalText) {
        console.log('Enterprise DLP: Sensitive data detected, replacing clipboard content');
        
        // Prevent default paste
        event.preventDefault();
        event.stopPropagation();
        
        // Insert processed text
        this.insertProcessedText(event.target, processedText);
        this.showNotification();
      }
    } catch (error) {
      console.error('Enterprise DLP: Error handling clipboard event:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Approach 2: DOM Mutation Monitoring (Real-time Content Analysis)
  setupMutationObserver() {
    console.log('Enterprise DLP: Setting up mutation observer');
    
    this.observer = new MutationObserver((mutations) => {
      if (this.isProcessing) return;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.processMutations(mutation);
        }
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });
  }

  processMutations(mutation) {
    const target = mutation.target;
    
    // Check if this is an input area
    if (this.isInputElement(target) || (target.parentElement && this.isInputElement(target.parentElement))) {
      const element = this.isInputElement(target) ? target : target.parentElement;
      const content = element.textContent || element.innerText || element.value || '';
      
      if (content && this.containsSensitiveData(content)) {
        console.log('Enterprise DLP: Sensitive data detected in DOM mutation');
        setTimeout(() => this.processElementContent(element), 10);
      }
    }
  }

  // Approach 3: Input Event Monitoring (Fallback)
  setupInputMonitoring() {
    console.log('Enterprise DLP: Setting up input monitoring');
    
    document.addEventListener('input', (event) => {
      if (this.isProcessing) return;
      
      const target = event.target;
      if (this.isInputElement(target)) {
        const content = target.value || target.textContent || target.innerText || '';
        if (content && this.containsSensitiveData(content)) {
          console.log('Enterprise DLP: Sensitive data detected in input event');
          setTimeout(() => this.processElementContent(target), 10);
        }
      }
    }, true);
  }

  isInputElement(element) {
    if (!element || !element.tagName) return false;
    
    return element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA' ||
           element.contentEditable === 'true' ||
           element.isContentEditable ||
           (element.getAttribute && element.getAttribute('contenteditable') === 'true');
  }

  containsSensitiveData(text) {
    return this.patterns.some(pattern => pattern.regex.test(text));
  }

  processText(text) {
    if (!text || !this.containsSensitiveData(text)) return text;
    
    console.log('Enterprise DLP: Processing sensitive data');
    
    let processedText = text;
    this.patterns.forEach(({ name, regex, replacement }) => {
      const matches = processedText.match(regex);
      if (matches) {
        console.log(`Enterprise DLP: Found ${name}:`, matches.length, 'instances');
        processedText = processedText.replace(regex, replacement);
      }
    });
    
    return processedText;
  }

  processElementContent(element) {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      
      const originalContent = element.value || element.textContent || element.innerText || '';
      const processedContent = this.processText(originalContent);
      
      if (processedContent !== originalContent) {
        console.log('Enterprise DLP: Replacing element content');
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = processedContent;
        } else {
          element.textContent = processedContent;
        }
        
        // Trigger change events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        this.showNotification();
      }
    } catch (error) {
      console.error('Enterprise DLP: Error processing element content:', error);
    } finally {
      setTimeout(() => { this.isProcessing = false; }, 100);
    }
  }

  insertProcessedText(target, text) {
    console.log('Enterprise DLP: Inserting processed text into target:', target.tagName, target.className);
    
    const actualTarget = this.findInputTarget(target);
    console.log('Enterprise DLP: Using actual target:', actualTarget.tagName, actualTarget.className);
    console.log('Enterprise DLP: Text to insert:', text.substring(0, 200));
    
    try {
      if (actualTarget.tagName === 'INPUT' || actualTarget.tagName === 'TEXTAREA') {
        // Standard input elements
        actualTarget.value = text;
        actualTarget.dispatchEvent(new Event('input', { bubbles: true }));
        actualTarget.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (actualTarget.contentEditable === 'true' || actualTarget.isContentEditable) {
        // ContentEditable elements (like Claude.ai)
        
        // Clear existing content
        actualTarget.innerHTML = '';
        
        // Insert the processed text
        if (text.includes('\n')) {
          // Convert newlines to HTML breaks
          actualTarget.innerHTML = text.replace(/\n/g, '<br>');
        } else {
          actualTarget.textContent = text;
        }
        
        // Set cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(actualTarget);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger events
        actualTarget.dispatchEvent(new Event('input', { bubbles: true }));
        actualTarget.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Enterprise DLP: Text insertion completed');
      }
    } catch (error) {
      console.error('Enterprise DLP: Error inserting text:', error);
    }
  }

  findInputTarget(element) {
    console.log('Enterprise DLP: Finding input target for:', element);
    
    // First, try to find Claude.ai specific input element
    const claudeSelectors = [
      '[contenteditable="true"].ProseMirror',
      '.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"]',
      '[role="textbox"]'
    ];
    
    for (const selector of claudeSelectors) {
      const found = document.querySelector(selector);
      if (found && found.offsetHeight > 20) { // Must be visible
        console.log('Enterprise DLP: Found Claude input via selector:', selector);
        return found;
      }
    }
    
    // Traverse up DOM tree to find input container
    let current = element;
    while (current && current !== document.body) {
      if (this.isInputElement(current) && current.offsetHeight > 20) {
        console.log('Enterprise DLP: Found input element via traversal:', current.tagName);
        return current;
      }
      current = current.parentElement;
    }
    
    // Last resort: return original element
    console.log('Enterprise DLP: Using original element as fallback');
    return element;
  }

  showNotification() {
    // Remove existing notifications
    const existing = document.querySelectorAll('.dlp-notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'dlp-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: dlpSlideIn 0.3s ease;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#dlp-styles')) {
      const style = document.createElement('style');
      style.id = 'dlp-styles';
      style.textContent = `
        @keyframes dlpSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.textContent = '🔒 Sensitive data protected';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  handleLegacyPaste(originalExecCommand, showDefaultUI, value) {
    console.log('Enterprise DLP: Handling legacy paste command');
    // For legacy browsers - less common now but included for completeness
    return originalExecCommand('paste', showDefaultUI, value);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize only once
if (!window.enterpriseDLP) {
  window.enterpriseDLP = new EnterpriseDLP();
  console.log('Enterprise DLP: Initialized');
}