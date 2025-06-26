// Content script for Sensitive Data Obfuscator extension

class ContentScriptHandler {
  constructor() {
    this.isEnabled = true;
    this.isLLMSite = false;
    this.settings = null;
    this.processingPaste = false;
    this.lastProcessedText = '';
    this.lastProcessedTime = 0;
    
    // Safety reset mechanism - reset processing flag every 5 seconds if stuck
    setInterval(() => {
      if (this.processingPaste && Date.now() - this.lastProcessedTime > 5000) {
        console.log('Sensitive Data Obfuscator: Resetting stuck processingPaste flag');
        this.processingPaste = false;
      }
    }, 5000);
    
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
    console.log('Sensitive Data Obfuscator: Paste event triggered on element:', event.target);
    
    if (!this.shouldProcessEvent(event)) {
      console.log('Sensitive Data Obfuscator: shouldProcessEvent returned false');
      return;
    }
    
    console.log('Sensitive Data Obfuscator: Processing paste event');

    try {
      this.processingPaste = true;
      
      // Get clipboard data
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText || pastedText.trim().length === 0) return;

      // Debug: Check processing state
      console.log('Sensitive Data Obfuscator: Current processingPaste state:', this.processingPaste);
      console.log('Sensitive Data Obfuscator: Last processed text length:', this.lastProcessedText.length);
      console.log('Sensitive Data Obfuscator: Current text length:', pastedText.length);
      
      // Debounce: prevent processing the same text within 2 seconds or if already processing
      const now = Date.now();
      const isDebounced = this.lastProcessedText === pastedText && (now - this.lastProcessedTime) < 2000;
      
      if (isDebounced) {
        console.log('Sensitive Data Obfuscator: Skipping due to debounce (same text within 2 seconds)');
        return;
      }
      
      if (this.processingPaste) {
        console.log('Sensitive Data Obfuscator: Skipping due to already processing paste');
        return;
      }
      
      this.lastProcessedText = pastedText;
      this.lastProcessedTime = now;

      console.log('Sensitive Data Obfuscator: Checking pasted text:', pastedText.substring(0, 100) + '...');

      // Check if text contains sensitive information
      if (!this.containsSensitiveData(pastedText)) {
        console.log('Sensitive Data Obfuscator: No sensitive data detected');
        return;
      }

      console.log('Sensitive Data Obfuscator: Sensitive data detected, preventing paste');

      // Prevent default paste behavior
      event.preventDefault();
      event.stopPropagation();

      // Obfuscate the text
      const obfuscatedText = await this.obfuscateText(pastedText);
      
      console.log('Sensitive Data Obfuscator: Original text sample:', pastedText.substring(0, 200));
      console.log('Sensitive Data Obfuscator: Obfuscated text sample:', obfuscatedText.substring(0, 200));
      
      // Verify obfuscation actually happened
      if (obfuscatedText === pastedText) {
        console.log('Sensitive Data Obfuscator: WARNING - Obfuscation failed, texts are identical');
      }
      
      // Insert obfuscated text
      this.insertObfuscatedText(event.target, obfuscatedText);
      
      // Show notification
      this.showObfuscationNotification();
      
    } catch (error) {
      console.error('Sensitive Data Obfuscator: Error handling paste event:', error);
    } finally {
      this.processingPaste = false;
      console.log('Sensitive Data Obfuscator: Processing completed, processingPaste set to false');
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
    console.log('Sensitive Data Obfuscator: shouldProcessEvent check - enabled:', this.isEnabled, 'isLLMSite:', this.isLLMSite);
    
    if (!this.isEnabled || !this.isLLMSite) {
      console.log('Sensitive Data Obfuscator: Extension disabled or not on LLM site');
      return false;
    }

    const target = event.target;
    if (!target) {
      console.log('Sensitive Data Obfuscator: No target element');
      return false;
    }

    console.log('Sensitive Data Obfuscator: Target element:', target.tagName, target.contentEditable, target.isContentEditable);

    // Check if target is an input element (expanded for Claude.ai)
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true' ||
                          target.isContentEditable ||
                          target.getAttribute('contenteditable') === 'true' ||
                          target.closest('[contenteditable="true"]') !== null;

    console.log('Sensitive Data Obfuscator: isInputElement:', isInputElement);

    if (!isInputElement) {
      console.log('Sensitive Data Obfuscator: Not an input element');
      return false;
    }

    // Skip password fields and other sensitive input types
    if (target.type === 'password' || target.type === 'hidden') {
      console.log('Sensitive Data Obfuscator: Skipping password/hidden field');
      return false;
    }

    console.log('Sensitive Data Obfuscator: shouldProcessEvent returning true');
    return true;
  }

  containsSensitiveData(text) {
    // Quick check for common sensitive data patterns
    const quickPatterns = [
      { pattern: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/, name: 'Credit card' },
      { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/, name: 'SSN' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, name: 'Email' },
      { pattern: /\b\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/, name: 'Phone' },
      { pattern: /\b\d{7,17}\b/, name: 'Account numbers' }
    ];

    console.log('Sensitive Data Obfuscator: Testing patterns against text sample:', text.substring(0, 200) + '...');
    
    let foundSensitiveData = false;
    quickPatterns.forEach(({ pattern, name }) => {
      const matches = text.match(pattern);
      if (matches) {
        console.log(`Sensitive Data Obfuscator: ${name} pattern matched:`, matches);
        foundSensitiveData = true;
      } else {
        console.log(`Sensitive Data Obfuscator: ${name} pattern did not match`);
      }
    });

    console.log('Sensitive Data Obfuscator: Overall sensitive data detected:', foundSensitiveData);
    return foundSensitiveData;
  }

  async obfuscateText(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'OBFUSCATE_TEXT',
        text: text,
        url: window.location.href
      });

      if (response && response.success) {
        return response.obfuscatedText;
      } else {
        console.error('Error obfuscating text:', response?.error || 'Unknown error');
        return this.fallbackObfuscation(text);
      }
    } catch (error) {
      console.error('Error communicating with background script:', error);
      console.log('Sensitive Data Obfuscator: Using fallback obfuscation');
      return this.fallbackObfuscation(text);
    }
  }

  fallbackObfuscation(text) {
    // Fallback obfuscation patterns when background script fails
    console.log('Sensitive Data Obfuscator: Starting fallback obfuscation');
    console.log('Sensitive Data Obfuscator: Fallback input text sample:', text.substring(0, 200));
    
    let obfuscatedText = text;
    
    const fallbackPatterns = [
      { pattern: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/g, replacement: 'XXXX-XXXX-XXXX-XXXX', name: 'Credit card' },
      { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: 'XXX-XX-XXXX', name: 'SSN' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: 'user@example.com', name: 'Email' },
      { pattern: /\b(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?[\d]{2,4}\)?[-.\s]?){2,4}[\d]{2,4}\b/g, replacement: 'XXX XXX XXXX', name: 'Phone' },
      { pattern: /\b\d{7,17}\b/g, replacement: 'XXXXXXXXX', name: 'Account number' }
    ];

    fallbackPatterns.forEach(({ pattern, replacement, name }) => {
      const matches = obfuscatedText.match(pattern);
      if (matches) {
        console.log(`Sensitive Data Obfuscator: Fallback ${name} pattern matched:`, matches);
        obfuscatedText = obfuscatedText.replace(pattern, replacement);
      } else {
        console.log(`Sensitive Data Obfuscator: Fallback ${name} pattern did not match`);
      }
    });

    console.log('Sensitive Data Obfuscator: Fallback obfuscation completed');
    console.log('Sensitive Data Obfuscator: Fallback output text sample:', obfuscatedText.substring(0, 200));
    return obfuscatedText;
  }

  insertObfuscatedText(target, text) {
    console.log('Sensitive Data Obfuscator: Inserting text into target:', target.tagName, target.className);
    
    // Find the actual content editable container for Claude.ai
    const actualTarget = this.findActualInputTarget(target);
    console.log('Sensitive Data Obfuscator: Using actual target:', actualTarget.tagName, actualTarget.className);
    
    if (actualTarget.tagName === 'INPUT' || actualTarget.tagName === 'TEXTAREA') {
      // For input and textarea elements
      const start = actualTarget.selectionStart || 0;
      const end = actualTarget.selectionEnd || 0;
      const currentValue = actualTarget.value || '';
      
      actualTarget.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      
      // Restore cursor position
      const newPosition = start + text.length;
      actualTarget.setSelectionRange(newPosition, newPosition);
      
      // Trigger multiple events for better compatibility
      actualTarget.dispatchEvent(new Event('input', { bubbles: true }));
      actualTarget.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // For contentEditable elements - enhanced for Claude.ai compatibility
      console.log('Sensitive Data Obfuscator: Handling contentEditable element');
      
      // Multiple insertion attempts to overcome Claude.ai's interference
      this.insertTextWithRetries(actualTarget, text);
    }
  }

  insertTextWithRetries(element, text, attempt = 1) {
    const maxAttempts = 1; // Reduce to 1 attempt to prevent loops
    
    console.log(`Sensitive Data Obfuscator: Text insertion attempt ${attempt}/${maxAttempts}`);
    console.log('Sensitive Data Obfuscator: Inserting text sample:', text.substring(0, 200));
    
    // Clear existing content completely
    element.innerHTML = '';
    element.textContent = '';
    if (element.innerText !== undefined) {
      element.innerText = '';
    }
    
    // Insert the obfuscated text using innerHTML for rich text support
    element.innerHTML = text.replace(/\n/g, '<br>');
    
    // Fallback to textContent if innerHTML didn't work
    if (!element.innerHTML || element.innerHTML.trim() === '') {
      element.textContent = text;
    }
    
    // Set cursor position
    try {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      console.log('Sensitive Data Obfuscator: Could not set cursor position:', e.message);
    }
    
    // Trigger minimal events to avoid loops - removed 'paste' event
    const events = ['input', 'change'];
    events.forEach(eventType => {
      try {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      } catch (e) {
        console.log(`Sensitive Data Obfuscator: Could not dispatch ${eventType} event:`, e.message);
      }
    });
    
    // Check result immediately
    const finalContent = element.textContent || element.innerText || '';
    console.log('Sensitive Data Obfuscator: Final content after insertion:', finalContent.substring(0, 200));
    
    if (finalContent.includes('XXXX') || finalContent.includes('XXXXXXXXX')) {
      console.log('Sensitive Data Obfuscator: Text insertion successful!');
    } else {
      console.log('Sensitive Data Obfuscator: Text insertion may have failed - content does not contain obfuscated markers');
    }
  }


  findActualInputTarget(element) {
    // Try to find the main contenteditable container
    let current = element;
    
    // First, try to go up the DOM tree to find a proper contenteditable container
    while (current && current !== document.body) {
      if (current.contentEditable === 'true' && 
          (current.tagName === 'DIV' || current.tagName === 'TEXTAREA') &&
          current.className && 
          (current.className.includes('editor') || 
           current.className.includes('input') || 
           current.className.includes('content') ||
           current.offsetHeight > 50)) { // Likely a main input area
        console.log('Sensitive Data Obfuscator: Found content editable container:', current);
        return current;
      }
      current = current.parentElement;
    }
    
    // Fallback: look for Claude.ai specific selectors
    const claudeSelectors = [
      '[data-testid="chat-input"]',
      '[contenteditable="true"]',
      '.ProseMirror',
      '[role="textbox"]'
    ];
    
    for (const selector of claudeSelectors) {
      const found = document.querySelector(selector);
      if (found && found.offsetHeight > 20) {
        console.log('Sensitive Data Obfuscator: Found input via selector:', selector, found);
        return found;
      }
    }
    
    // Last resort: return original element
    console.log('Sensitive Data Obfuscator: Using original target as fallback');
    return element;
  }

  triggerFrameworkEvents(element) {
    // React event handling
    const reactEventTarget = element._reactInternalInstance || 
                           element.__reactInternalInstance ||
                           element.__reactInternalFiber ||
                           element._reactInternalFiber;
    
    if (reactEventTarget) {
      console.log('Sensitive Data Obfuscator: Triggering React events');
      const syntheticEvent = new Event('input', { bubbles: true });
      syntheticEvent.simulated = true;
      element.dispatchEvent(syntheticEvent);
    }
    
    // Vue.js event handling
    if (element.__vue__ || element._vnode) {
      console.log('Sensitive Data Obfuscator: Triggering Vue events');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Force a re-render by modifying and restoring a property
    setTimeout(() => {
      const originalDisplay = element.style.display;
      element.style.display = 'none';
      element.offsetHeight; // Force reflow
      element.style.display = originalDisplay;
    }, 10);
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

