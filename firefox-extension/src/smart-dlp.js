// Smart Enterprise DLP with Contextual Obfuscation and Interactive Reveals - Firefox Version

class SmartEnterpriseDLP {
  constructor() {
    this.isEnabled = true;
    this.isLLMSite = false;
    this.isProcessing = false;
    this.obfuscatedElements = new Map(); // Track obfuscated content for reveals
    
    // Enhanced contextual patterns with smart replacements (ordered by specificity)
    this.smartPatterns = [
      {
        name: 'Email Address',
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL]',
        icon: '📧',
        category: 'contact',
        contextWords: ['email', 'mail', 'contact', 'address']
      },
      {
        name: 'Credit Card',
        regex: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/g,
        replacement: '[CREDIT_CARD]',
        icon: '💳',
        category: 'financial',
        contextWords: ['card', 'payment', 'billing', 'visa', 'mastercard', 'amex']
      },
      {
        name: 'SSN',
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        replacement: '[SSN]',
        icon: '🆔',
        category: 'identity',
        contextWords: ['ssn', 'social', 'security', 'tax']
      },
      {
        name: 'Phone Number',
        regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{2,4}\b/g,
        replacement: '[PHONE_NUMBER]',
        icon: '📞',
        category: 'contact',
        contextWords: ['phone', 'mobile', 'cell', 'contact', 'call', 'number']
      },
      {
        name: 'Username',
        regex: /(?:username|user|login|id):\s*([a-zA-Z0-9._-]{3,20})/gi,
        replacement: '[USERNAME]',
        icon: '👤',
        category: 'credentials',
        contextWords: ['username', 'user', 'login', 'id', 'account']
      },
      {
        name: 'Password',
        regex: /(?:password|pass|pwd):\s*([^\s\n\r]{4,})/gi,
        replacement: '[PASSWORD]',
        icon: '🔐',
        category: 'credentials',
        contextWords: ['password', 'pass', 'pwd', 'secret']
      },
      {
        name: 'Security Code',
        regex: /(?:phone\s+sec\s+no|security\s+code|pin)[\s\(]*:\s*\(?(\d{3,6})\)?/gi,
        replacement: '[SECURITY_CODE]',
        icon: '🔢',
        category: 'security',
        contextWords: ['security', 'code', 'pin', 'verification', 'sec']
      },
      {
        name: 'Security Digits',
        regex: /phone\s+sec\s+no\s*\(\d+\s+digits?\)\s*:\s*(\d{2,6})/gi,
        replacement: '[SECURITY_CODE]',
        icon: '🔢',
        category: 'security',
        contextWords: ['sec', 'digits', 'phone', 'security']
      },
      {
        name: 'Transit Number',
        regex: /(?:transit\s+no|routing):\s*(\d{5,9})/gi,
        replacement: '[TRANSIT_NUMBER]',
        icon: '🏪',
        category: 'financial',
        contextWords: ['transit', 'routing', 'bank', 'institution']
      },
      {
        name: 'Institution Number',
        regex: /(?:institution\s+no):\s*(\d{3,4})/gi,
        replacement: '[INSTITUTION_NUMBER]',
        icon: '🏛️',
        category: 'financial',
        contextWords: ['institution', 'bank', 'financial']
      },
      {
        name: 'Account Number',
        regex: /(?:account\s+(?:no|number)):\s*(\d{7,17})/gi,
        replacement: '[ACCOUNT_NUMBER]',
        icon: '🏦',
        category: 'financial',
        contextWords: ['account', 'number', 'bank', 'routing']
      }
    ];
    
    this.init();
  }

  async init() {
    await this.checkSiteStatus();
    
    console.log(`Firefox Smart DLP: Site check - hostname: ${window.location.hostname}, isLLM: ${this.isLLMSite}, enabled: ${this.isEnabled}`);
    
    if (this.isLLMSite && this.isEnabled) {
      console.log('Firefox Smart DLP: Initializing popup-based data management system');
      this.injectStyles();
      this.interceptClipboard();
      this.setupMutationObserver();
      this.setupInputMonitoring();
      this.createFloatingPanel();
    } else {
      console.log(`Firefox Smart DLP: Not initializing - isLLMSite: ${this.isLLMSite}, isEnabled: ${this.isEnabled}`);
    }
  }

  injectStyles() {
    // Remove existing styles first
    const existingStyle = document.getElementById('smart-dlp-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'smart-dlp-styles';
    style.textContent = `
      .smart-dlp-token {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 2px 8px !important;
        border-radius: 12px !important;
        font-size: 0.85em !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        display: inline-block !important;
        margin: 0 2px !important;
        position: relative !important;
        transition: all 0.3s ease !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      }
      
      .smart-dlp-token:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
      }
      
      .smart-dlp-token.financial {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
      }
      
      .smart-dlp-token.contact {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      }
      
      .smart-dlp-token.identity {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
      }
      
      .smart-dlp-token.credentials {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
      }
      
      .smart-dlp-token.security {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
      }
      
      .smart-dlp-reveal {
        position: absolute !important;
        top: 100% !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: #2d3748 !important;
        color: white !important;
        padding: 8px 12px !important;
        border-radius: 8px !important;
        font-size: 0.8em !important;
        white-space: nowrap !important;
        z-index: 999999 !important;
        margin-top: 5px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        border: 1px solid #4a5568 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease !important;
        display: none !important;
      }
      
      .smart-dlp-reveal::before {
        content: '' !important;
        position: absolute !important;
        top: -5px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        border-left: 5px solid transparent !important;
        border-right: 5px solid transparent !important;
        border-bottom: 5px solid #2d3748 !important;
      }
      
      .smart-dlp-token:hover .smart-dlp-reveal {
        opacity: 1 !important;
        pointer-events: auto !important;
        display: block !important;
      }
      
      .smart-dlp-controls {
        margin-top: 4px !important;
        font-size: 0.7em !important;
      }
      
      .smart-dlp-btn {
        background: #4299e1 !important;
        color: white !important;
        border: none !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        margin-right: 4px !important;
        font-size: 0.7em !important;
      }
      
      .smart-dlp-btn:hover {
        background: #3182ce !important;
      }
      
      .smart-dlp-btn.danger {
        background: #e53e3e !important;
      }
      
      .smart-dlp-btn.danger:hover {
        background: #c53030 !important;
      }
    `;
    document.head.appendChild(style);
    console.log('Firefox Smart DLP: Styles injected with !important declarations');
  }

  async checkSiteStatus() {
    try {
      // Firefox uses browser.runtime instead of chrome.runtime
      const response = await browser.runtime.sendMessage({ type: 'GET_SITE_STATUS' });
      if (response && response.success) {
        this.isLLMSite = response.status.isLLMSite;
        this.isEnabled = response.status.enabled;
      } else {
        this.isLLMSite = this.detectLLMSite();
        this.isEnabled = true;
      }
    } catch (error) {
      console.log('Firefox Smart DLP: Using fallback site detection');
      this.isLLMSite = this.detectLLMSite();
      this.isEnabled = true;
    }
  }

  detectLLMSite() {
    const hostname = window.location.hostname;
    const llmSites = ['claude.ai', 'chat.openai.com', 'chatgpt.com', 'bard.google.com', 'gemini.google.com', 'bing.com', 'you.com', 'perplexity.ai'];
    const isLLM = llmSites.some(site => hostname.includes(site));
    console.log('Firefox Smart DLP: Site detection - hostname:', hostname, 'isLLM:', isLLM);
    return isLLM;
  }

  interceptClipboard() {
    console.log('Firefox Smart DLP: Setting up intelligent clipboard interception');
    document.addEventListener('paste', (event) => this.handleClipboardEvent(event), true);
  }

  async handleClipboardEvent(event) {
    if (this.isProcessing) return;
    
    console.log('Firefox Smart DLP: Analyzing clipboard content');
    
    try {
      this.isProcessing = true;
      
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) {
        console.log('Firefox Smart DLP: No clipboard data available');
        return;
      }

      const originalText = clipboardData.getData('text/plain');
      if (!originalText || originalText.trim().length === 0) {
        console.log('Firefox Smart DLP: Empty clipboard content');
        return;
      }

      // Skip if the text is very short (likely not sensitive data)
      if (originalText.trim().length < 3) {
        console.log('Firefox Smart DLP: Text too short to contain sensitive data');
        return;
      }

      const processedResult = this.smartProcessText(originalText);
      
      if (processedResult.hasChanges) {
        console.log('Firefox Smart DLP: Sensitive data detected, applying contextual protection');
        
        event.preventDefault();
        event.stopPropagation();
        
        // Verify target is valid before inserting
        if (!event.target || !this.isInputElement(event.target)) {
          console.log('Firefox Smart DLP: Invalid target for paste event');
          return;
        }
        
        this.insertSmartContent(event.target, processedResult);
        this.showSmartNotification(processedResult.detectedTypes);
      } else {
        console.log('Firefox Smart DLP: No sensitive data detected in clipboard content');
      }
    } catch (error) {
      console.error('Firefox Smart DLP: Error handling clipboard event:', error);
      // Allow the original paste to proceed if our processing fails
    } finally {
      setTimeout(() => { this.isProcessing = false; }, 100);
    }
  }

  setupMutationObserver() {
    try {
      this.observer = new MutationObserver((mutations) => {
        if (this.isProcessing) return;
        
        mutations.forEach((mutation) => {
          try {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              this.processMutations(mutation);
            }
          } catch (error) {
            console.error('Firefox Smart DLP: Error in mutation processing:', error);
          }
        });
      });

      // Wait for document.body to be available
      if (document.body) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: true
        });
        console.log('Firefox Smart DLP: MutationObserver setup complete');
      } else {
        // Wait for document.body to be ready
        const bodyObserver = new MutationObserver(() => {
          if (document.body) {
            bodyObserver.disconnect();
            this.setupMutationObserver();
          }
        });
        bodyObserver.observe(document.documentElement, { childList: true });
      }
    } catch (error) {
      console.error('Firefox Smart DLP: Error setting up MutationObserver:', error);
    }
  }

  processMutations(mutation) {
    const target = mutation.target;
    
    if (this.isInputElement(target) || (target.parentElement && this.isInputElement(target.parentElement))) {
      const element = this.isInputElement(target) ? target : target.parentElement;
      const content = element.textContent || element.innerText || element.value || '';
      
      if (content && this.containsSensitiveData(content)) {
        setTimeout(() => this.processElementContent(element), 10);
      }
    }
  }

  setupInputMonitoring() {
    document.addEventListener('input', (event) => {
      if (this.isProcessing) return;
      
      const target = event.target;
      if (this.isInputElement(target)) {
        const content = target.value || target.textContent || target.innerText || '';
        if (content && this.containsSensitiveData(content)) {
          setTimeout(() => this.processElementContent(target), 10);
        }
      }
    }, true);
  }

  cleanExistingMarkers(text) {
    // Remove any existing markers and restore original values where possible
    const markerRegex = /◆([^◆]+)◆([^◆]+)◆/g;
    
    return text.replace(markerRegex, (match, replacement, tokenId) => {
      // Try to get the original value from our storage
      const tokenData = this.obfuscatedElements.get(tokenId);
      if (tokenData && tokenData.original) {
        console.log(`Firefox Smart DLP: Restoring original value for ${replacement}: ${tokenData.original}`);
        return tokenData.original;
      }
      
      // If we can't find the original, just return the replacement text
      console.log(`Firefox Smart DLP: No original value found for ${replacement}, using replacement`);
      return replacement;
    });
  }

  smartProcessText(text) {
    const result = {
      originalText: text,
      processedText: text,
      hasChanges: false,
      detectedItems: [],
      detectedTypes: new Set()
    };

    console.log('Firefox Smart DLP: Analyzing text for contextual patterns');

    // Clean any existing markers from the text to prevent corruption
    const cleanText = this.cleanExistingMarkers(text);
    if (cleanText !== text) {
      console.log('Firefox Smart DLP: Cleaned existing markers from text');
      result.processedText = cleanText;
      text = cleanText;
    }

    // Skip processing if text still contains our markers (avoid double processing)
    if (text.includes('◆[') && text.includes(']◆')) {
      console.log('Firefox Smart DLP: Text still contains markers after cleaning, skipping processing');
      return result;
    }

    this.smartPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      
      if (matches.length > 0) {
        console.log(`Firefox Smart DLP: Found ${pattern.name}:`, matches.length, 'instances');
        
        matches.forEach(match => {
          const fullMatch = match[0];
          const capturedValue = match[1]; // The captured group (the sensitive value)
          
          // Skip if this match contains our markers (corrupted data)
          if (fullMatch.includes('◆[') || fullMatch.includes(']◆')) {
            console.log(`Firefox Smart DLP: Skipping corrupted match: ${fullMatch}`);
            return;
          }
          
          // Use captured value if available, otherwise use full match
          const sensitiveValue = (capturedValue && typeof capturedValue === 'string' && capturedValue.trim()) ? capturedValue.trim() : fullMatch;
          
          // Skip if the sensitive value is already a token pattern (avoid re-tokenizing tokens)
          if (sensitiveValue.startsWith('[') && sensitiveValue.endsWith(']') && 
              /^[A-Z_]+$/.test(sensitiveValue.slice(1, -1))) {
            console.log(`Firefox Smart DLP: Skipping token pattern as original value: ${sensitiveValue}`);
            return;
          }
          
          console.log(`Firefox Smart DLP: Pattern ${pattern.name} - Full: "${fullMatch}", Captured: "${capturedValue}", Using: "${sensitiveValue}"`);
          
          // Analyze context around the match
          const context = this.analyzeContext(text, match.index, pattern);
          
          const detectedItem = {
            type: pattern.name,
            category: pattern.category,
            original: sensitiveValue, // Store the actual sensitive value
            value: sensitiveValue,
            replacement: pattern.replacement,
            icon: pattern.icon,
            context: context,
            confidence: this.calculateConfidence(text, match.index, pattern),
            fullMatch: fullMatch // Keep track of full match for replacement
          };
          
          result.detectedItems.push(detectedItem);
          result.detectedTypes.add(pattern.name);
          result.hasChanges = true;
        });
        
        // Replace all matches with smart tokens
        result.processedText = result.processedText.replace(pattern.regex, (match, captured) => {
          // Skip if this match contains our markers (corrupted data)
          if (match.includes('◆[') || match.includes(']◆')) {
            return match; // Return unchanged
          }
          
          // For patterns with capture groups, only replace the captured value
          if (captured && typeof captured === 'string' && captured.trim()) {
            const sensitiveValue = captured.trim();
            
            // Skip if the sensitive value is already a token pattern
            if (sensitiveValue.startsWith('[') && sensitiveValue.endsWith(']') && 
                /^[A-Z_]+$/.test(sensitiveValue.slice(1, -1))) {
              return match; // Return unchanged
            }
            
            const tokenReplacement = this.createSmartToken(pattern, sensitiveValue);
            return match.replace(captured, tokenReplacement);
          } else {
            // No capture group, replace entire match
            // Skip if the match is already a token pattern
            if (match.startsWith('[') && match.endsWith(']') && 
                /^[A-Z_]+$/.test(match.slice(1, -1))) {
              return match; // Return unchanged
            }
            
            return this.createSmartToken(pattern, match);
          }
        });
      }
    });

    return result;
  }

  analyzeContext(text, index, pattern) {
    const contextWindow = 50;
    const start = Math.max(0, index - contextWindow);
    const end = Math.min(text.length, index + contextWindow);
    const context = text.substring(start, end).toLowerCase();
    
    const relevantWords = pattern.contextWords.filter(word => 
      context.includes(word.toLowerCase())
    );
    
    return {
      surroundingText: context,
      relevantKeywords: relevantWords,
      confidence: relevantWords.length > 0 ? 'high' : 'medium'
    };
  }

  calculateConfidence(text, index, pattern) {
    const context = this.analyzeContext(text, index, pattern);
    let confidence = 0.5;
    
    // Boost confidence based on context keywords
    confidence += context.relevantKeywords.length * 0.1;
    
    // Pattern-specific confidence adjustments
    switch (pattern.name) {
      case 'Credit Card':
        confidence = 0.9; // Credit cards are usually obvious
        break;
      case 'Email Address':
        confidence = 0.95; // Emails are very obvious
        break;
      case 'Username':
      case 'Password':
        confidence = context.relevantKeywords.length > 0 ? 0.9 : 0.6;
        break;
    }
    
    return Math.min(confidence, 1.0);
  }

  createSmartToken(pattern, value) {
    // Check if we already have an active token for this exact value and pattern
    // This prevents duplicate tokenization of the same data
    const existingEntry = Array.from(this.obfuscatedElements.entries()).find(([id, data]) => 
      data.original === value && 
      data.pattern.name === pattern.name &&
      (!data.currentState || data.currentState === 'token') // Only reuse if in default state
    );
    
    if (existingEntry) {
      console.log(`Firefox Smart DLP: Reusing existing token for ${pattern.name}: ${value}`);
      return `◆${pattern.replacement}◆${existingEntry[0]}◆`;
    }
    
    // Create new token
    const tokenId = `dlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the original value for reveals
    this.obfuscatedElements.set(tokenId, {
      original: value,
      pattern: pattern,
      timestamp: Date.now()
    });
    
    console.log(`Firefox Smart DLP: Created new token ${tokenId} for ${pattern.name}: ${value}`);
    
    // Return the replacement text with a special marker for post-processing
    return `◆${pattern.replacement}◆${tokenId}◆`;
  }

  insertSmartContent(target, processedResult) {
    console.log('Firefox Smart DLP: Inserting smart content with interactive tokens');
    
    const actualTarget = this.findInputTarget(target);
    
    try {
      // Set flag to prevent reprocessing during our insertion
      this.isProcessing = true;
      
      if (actualTarget.tagName === 'INPUT' || actualTarget.tagName === 'TEXTAREA') {
        // For simple inputs, just use text replacements
        let processedText = processedResult.processedText;
        
        // Clean up any existing malformed markers first
        processedText = this.cleanAllMarkers(processedText);
        
        // Replace token markers with simple text
        this.obfuscatedElements.forEach((data, tokenId) => {
          const marker = `◆${data.pattern.replacement}◆${tokenId}◆`;
          processedText = processedText.replace(marker, data.pattern.replacement);
        });
        
        actualTarget.value = processedText;
        actualTarget.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (actualTarget.contentEditable === 'true' || actualTarget.isContentEditable) {
        // Insert processed text and convert markers to interactive tokens
        let processedText = processedResult.processedText;
        
        // Clean up any existing malformed markers first
        processedText = this.cleanAllMarkers(processedText);
        
        // First, insert the text with markers
        actualTarget.innerHTML = processedText.replace(/\n/g, '<br>');
        
        // Then convert the markers to interactive tokens
        setTimeout(() => {
          this.convertMarkersToTokens(actualTarget);
        }, 10);
        
        actualTarget.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Show floating panel since we have sensitive data
        this.showFloatingPanel();
      }
    } catch (error) {
      console.error('Firefox Smart DLP: Error inserting smart content:', error);
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => { this.isProcessing = false; }, 200);
    }
  }

  cleanAllMarkers(text) {
    // Remove any malformed markers that might exist in the text
    const markerRegex = /◆([^◆]+)◆([^◆]+)◆/g;
    return text.replace(markerRegex, (match, replacement, tokenId) => {
      // Try to get original value if token still exists
      const tokenData = this.obfuscatedElements.get(tokenId);
      if (tokenData && (tokenData.currentState === 'original' || tokenData.currentState === 'edited')) {
        return tokenData.original;
      }
      // Otherwise return the replacement token
      return replacement;
    });
  }

  convertMarkersToTokens(container) {
    console.log('Firefox Smart DLP: Converting markers to interactive tokens');
    
    // Use TreeWalker to find and replace text nodes containing markers
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('◆')) {
        textNodes.push(node);
      }
    }
    
    let hasReplacements = false;
    const markerRegex = /◆([^◆]+)◆([^◆]+)◆/g;
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const matches = [...text.matchAll(markerRegex)];
      
      if (matches.length > 0) {
        hasReplacements = true;
        
        // Create a document fragment to hold the new nodes
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        
        matches.forEach(match => {
          const [fullMatch, replacement, tokenId] = match;
          const matchStart = match.index;
          
          // Add text before the match
          if (matchStart > lastIndex) {
            const beforeText = text.substring(lastIndex, matchStart);
            if (beforeText) {
              fragment.appendChild(document.createTextNode(beforeText));
            }
          }
          
          // Create the interactive token element
          const tokenElement = this.createTokenElement(replacement, tokenId);
          fragment.appendChild(tokenElement);
          
          lastIndex = matchStart + fullMatch.length;
        });
        
        // Add remaining text after the last match
        if (lastIndex < text.length) {
          const afterText = text.substring(lastIndex);
          if (afterText) {
            fragment.appendChild(document.createTextNode(afterText));
          }
        }
        
        // Replace the text node with the fragment
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
    
    if (hasReplacements) {
      console.log('Firefox Smart DLP: Token conversion completed');
      
      // Show the floating panel since we have sensitive data
      this.showFloatingPanel();
    }
  }

  createTokenElement(replacement, tokenId) {
    console.log(`Firefox Smart DLP: Creating interactive token element for: ${replacement}`);
    
    const tokenData = this.obfuscatedElements.get(tokenId);
    if (!tokenData) {
      console.warn(`Firefox Smart DLP: No token data found for ID: ${tokenId}`);
      return document.createTextNode(replacement);
    }
    
    // Create interactive token span
    const span = document.createElement('span');
    span.className = `smart-dlp-token ${tokenData.pattern.category}`;
    span.setAttribute('data-token-id', tokenId);
    span.textContent = replacement;
    span.style.cssText = `
      background: ${this.getCategoryBackground(tokenData.pattern.category)} !important;
      color: white !important;
      padding: 2px 8px !important;
      border-radius: 12px !important;
      font-size: 0.85em !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      display: inline-block !important;
      margin: 0 2px !important;
      position: relative !important;
      transition: all 0.3s ease !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
    `;
    
    // Create hover tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'smart-dlp-reveal';
    tooltip.style.cssText = `
      position: absolute !important;
      top: 100% !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: #2d3748 !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 8px !important;
      font-size: 0.8em !important;
      white-space: nowrap !important;
      z-index: 999999 !important;
      margin-top: 5px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      border: 1px solid #4a5568 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.2s ease !important;
      display: none !important;
    `;
    
    // Add arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute !important;
      top: -5px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      border-left: 5px solid transparent !important;
      border-right: 5px solid transparent !important;
      border-bottom: 5px solid #2d3748 !important;
    `;
    tooltip.appendChild(arrow);
    
    // Add tooltip content
    const originalValue = document.createElement('div');
    originalValue.style.cssText = `
      font-weight: bold !important;
      margin-bottom: 4px !important;
    `;
    originalValue.textContent = `Original: ${tokenData.original}`;
    tooltip.appendChild(originalValue);
    
    // Add controls
    const controls = document.createElement('div');
    controls.className = 'smart-dlp-controls';
    controls.style.cssText = `
      margin-top: 4px !important;
      font-size: 0.7em !important;
    `;
    
    const useOriginalBtn = document.createElement('button');
    useOriginalBtn.className = 'smart-dlp-btn';
    useOriginalBtn.textContent = 'Use Original';
    useOriginalBtn.style.cssText = `
      background: #4299e1 !important;
      color: white !important;
      border: none !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      margin-right: 4px !important;
      font-size: 0.7em !important;
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'smart-dlp-btn danger';
    removeBtn.textContent = 'Remove';
    removeBtn.style.cssText = `
      background: #e53e3e !important;
      color: white !important;
      border: none !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-size: 0.7em !important;
    `;
    
    controls.appendChild(useOriginalBtn);
    controls.appendChild(removeBtn);
    tooltip.appendChild(controls);
    span.appendChild(tooltip);
    
    // Add event listeners
    span.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
      tooltip.style.pointerEvents = 'auto';
    });
    
    span.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      setTimeout(() => {
        if (tooltip.style.opacity === '0') {
          tooltip.style.display = 'none';
        }
      }, 200);
    });
    
    // Button event handlers
    useOriginalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      span.textContent = tokenData.original;
      span.setAttribute('data-state', 'original');
      tooltip.style.display = 'none';
      console.log(`Firefox Smart DLP: Used original value for ${replacement}`);
    });
    
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      span.remove();
      this.obfuscatedElements.delete(tokenId);
      console.log(`Firefox Smart DLP: Removed token ${replacement}`);
    });
    
    return span;
  }

  getCategoryBackground(category) {
    const backgrounds = {
      'financial': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      'contact': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'identity': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'credentials': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'security': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    return backgrounds[category] || backgrounds.contact;
  }

  createFloatingPanel() {
    console.log('Firefox Smart DLP: Creating floating control panel');
    
    // Create floating button/panel that appears when sensitive data is detected
    this.floatingPanel = document.createElement('div');
    this.floatingPanel.id = 'smart-dlp-floating-panel';
    this.floatingPanel.style.cssText = `
      position: absolute !important;
      bottom: 10px !important;
      right: 10px !important;
      width: 40px !important;
      height: 40px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-radius: 50% !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important;
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.3s ease !important;
      border: 2px solid rgba(255,255,255,0.2) !important;
    `;
    
    // Add shield icon using CSS
    this.floatingPanel.innerHTML = `
      <div style="
        width: 18px !important;
        height: 18px !important;
        background: white !important;
        mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 1.26c3.09 1.26 5.09 4.19 5.09 7.56v6.94l-8.18 4.24L3.82 16.76V9.82c0-3.37 2-6.3 5.09-7.56L12 1z"/></svg>') center/contain !important;
        -webkit-mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3.09 1.26c3.09 1.26 5.09 4.19 5.09 7.56v6.94l-8.18 4.24L3.82 16.76V9.82c0-3.37 2-6.3 5.09-7.56L12 1z"/></svg>') center/contain !important;
      "></div>
    `;
    
    // Add hover effects
    this.floatingPanel.addEventListener('mouseenter', () => {
      this.floatingPanel.style.transform = 'scale(1.1)';
      this.floatingPanel.style.boxShadow = '0 6px 30px rgba(0,0,0,0.4)';
    });
    
    this.floatingPanel.addEventListener('mouseleave', () => {
      this.floatingPanel.style.transform = 'scale(1)';
      this.floatingPanel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    });
    
    // Click to open popup
    this.floatingPanel.addEventListener('click', () => {
      this.openSensitiveDataPopup();
    });
    
    // Try to position inside chatbox
    this.positionFloatingPanel();
    console.log('Firefox Smart DLP: Floating panel created');
  }
  
  positionFloatingPanel() {
    // Try to find chatbox container
    const chatContainer = document.querySelector('[data-testid="chat-input"]') || 
                         document.querySelector('.ProseMirror') || 
                         document.querySelector('[contenteditable="true"]');
    
    if (chatContainer && chatContainer.offsetParent) {
      // Position relative to chat container
      const container = chatContainer.offsetParent;
      container.style.position = 'relative';
      container.appendChild(this.floatingPanel);
      console.log('Firefox Smart DLP: Positioned floating panel inside chat container');
    } else {
      // Fallback to document body
      document.body.appendChild(this.floatingPanel);
      this.floatingPanel.style.position = 'fixed';
      this.floatingPanel.style.bottom = '20px';
      this.floatingPanel.style.right = '20px';
      console.log('Firefox Smart DLP: Positioned floating panel on page');
    }
  }

  showFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.style.display = 'flex';
      console.log('Firefox Smart DLP: Floating panel shown');
    }
  }
  
  hideFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.style.display = 'none';
      console.log('Firefox Smart DLP: Floating panel hidden');
    }
  }

  cleanupDuplicateTokens() {
    console.log('Firefox Smart DLP: Cleaning up duplicate tokens');
    
    const seen = new Map(); // Track pattern.name + original combinations
    const toDelete = [];
    
    this.obfuscatedElements.forEach((data, tokenId) => {
      const key = `${data.pattern.name}:${data.original}`;
      
      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        toDelete.push(tokenId);
        console.log(`Firefox Smart DLP: Found duplicate token ${tokenId} for ${key}`);
      } else {
        // First occurrence - keep it
        seen.set(key, tokenId);
      }
    });
    
    // Delete the duplicates
    toDelete.forEach(tokenId => {
      this.obfuscatedElements.delete(tokenId);
    });
    
    console.log(`Firefox Smart DLP: Cleaned up ${toDelete.length} duplicate tokens`);
  }

  openSensitiveDataPopup() {
    console.log('Firefox Smart DLP: Opening sensitive data management popup');
    
    // Clean up any orphaned or duplicate tokens before showing popup
    this.cleanupDuplicateTokens();
    
    // Remove existing popup
    const existing = document.querySelector('#smart-dlp-popup');
    if (existing) existing.remove();
    
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'smart-dlp-popup';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0,0,0,0.5) !important;
      z-index: 9999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white !important;
      border-radius: 12px !important;
      width: 600px !important;
      max-width: 90vw !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
      font-family: Arial, sans-serif !important;
    `;
    
    // Create popup header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px !important;
      border-bottom: 1px solid #e2e8f0 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    `;
    
    header.innerHTML = `
      <h2 style="margin: 0 !important; color: #2d3748 !important; font-size: 18px !important;">🔒 Sensitive Data Manager</h2>
      <button id="smart-dlp-close" style="
        background: none !important;
        border: none !important;
        font-size: 24px !important;
        cursor: pointer !important;
        color: #666 !important;
        padding: 5px !important;
      ">×</button>
    `;
    
    // Create popup body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 20px !important;
    `;
    
    // Add detected items
    const detectedItems = Array.from(this.obfuscatedElements.entries());
    
    if (detectedItems.length === 0) {
      body.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No sensitive data detected in current text.</p>';
    } else {
      const itemsHTML = detectedItems.map(([tokenId, data]) => `
        <div style="
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
          background: #f7fafc;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px;">
                ${this.getCategoryIcon(data.pattern.category)} ${data.pattern.name}
              </div>
              <div style="font-size: 14px; color: #666;">
                Original: <span style="font-family: monospace; background: #fff; padding: 2px 4px; border-radius: 4px;">${data.original}</span>
              </div>
              <div style="font-size: 12px; color: #888; margin-top: 4px;" id="currently-showing-${tokenId}">
                Currently showing: ${this.getCurrentlyShowing(tokenId)}
              </div>
            </div>
            <div style="display: flex; gap: 8px;" id="buttons-${tokenId}">
              ${this.generateButtonsForState(tokenId, data)}
            </div>
          </div>
        </div>
      `).join('');
      
      body.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">Detected Sensitive Data (${detectedItems.length} items)</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">Manage how sensitive data appears in your prompt:</p>
        </div>
        ${itemsHTML}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <button id="smart-dlp-done-btn" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
          ">✓ Done</button>
        </div>
      `;
    }
    
    popup.appendChild(header);
    popup.appendChild(body);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Close handlers
    document.getElementById('smart-dlp-close').addEventListener('click', () => {
      this.closePopup();
    });
    
    document.getElementById('smart-dlp-done-btn').addEventListener('click', () => {
      this.closePopup();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closePopup();
      }
    });
    
    // Add event listeners for all action buttons
    overlay.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-action')) {
        const action = e.target.getAttribute('data-action');
        const tokenId = e.target.getAttribute('data-token-id');
        
        console.log('Firefox Smart DLP: Button clicked:', action, tokenId);
        
        switch(action) {
          case 'edit':
            this.editTokenInPopup(tokenId);
            break;
          case 'use':
            this.useOriginalInPopup(tokenId);
            break;
          case 'remove':
            this.removeTokenInPopup(tokenId);
            break;
          case 'restore':
            this.restoreTokenInPopup(tokenId);
            break;
        }
      }
    });
  }
  
  getCategoryIcon(category) {
    const icons = {
      'financial': '💳',
      'contact': '📞',
      'credentials': '🔐',
      'identity': '🆔',
      'security': '🔢'
    };
    return icons[category] || '🔒';
  }
  
  getCurrentlyShowing(tokenId) {
    const data = this.obfuscatedElements.get(tokenId);
    if (!data) return 'Unknown';
    
    // Check if this token has been marked as used or removed
    if (data.currentState === 'original') {
      return data.original;
    } else if (data.currentState === 'removed') {
      return '[REMOVED]';
    } else if (data.currentState === 'edited') {
      return data.original; // Show the edited value
    }
    
    return data.pattern.replacement;
  }

  generateButtonsForState(tokenId, data) {
    const currentState = data.currentState || 'token';
    
    if (currentState === 'original') {
      // Only show edit and restore to token buttons
      return `
        <button data-action="edit" data-token-id="${tokenId}" style="
          background: #ed8936;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">✏️ Edit</button>
        <button data-action="restore" data-token-id="${tokenId}" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🔒 Restore Token</button>
        <button data-action="remove" data-token-id="${tokenId}" style="
          background: #f56565;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🗑️ Remove</button>
      `;
    } else if (currentState === 'edited') {
      // Show edit and restore token buttons (similar to original state)
      return `
        <button data-action="edit" data-token-id="${tokenId}" style="
          background: #ed8936;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">✏️ Edit</button>
        <button data-action="restore" data-token-id="${tokenId}" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🔒 Restore Token</button>
        <button data-action="remove" data-token-id="${tokenId}" style="
          background: #f56565;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🗑️ Remove</button>
      `;
    } else if (currentState === 'removed') {
      // Only show restore button
      return `
        <button data-action="restore" data-token-id="${tokenId}" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">♻️ Restore</button>
      `;
    } else {
      // Default state - show all buttons
      return `
        <button data-action="edit" data-token-id="${tokenId}" style="
          background: #ed8936;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">✏️ Edit</button>
        <button data-action="use" data-token-id="${tokenId}" style="
          background: #48bb78;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🔄 Use Original</button>
        <button data-action="remove" data-token-id="${tokenId}" style="
          background: #f56565;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">🗑️ Remove</button>
      `;
    }
  }

  closePopup() {
    const popup = document.querySelector('#smart-dlp-popup');
    if (popup) {
      popup.remove();
    }
    
    // Hide floating panel if no more sensitive data
    if (this.obfuscatedElements.size === 0) {
      this.hideFloatingPanel();
    }
  }

  editTokenInPopup(tokenId) {
    const data = this.obfuscatedElements.get(tokenId);
    if (data) {
      const newValue = prompt(`Edit ${data.pattern.name}:`, data.original);
      if (newValue !== null && newValue !== data.original) {
        // Set processing flag to prevent reprocessing
        this.isProcessing = true;
        
        // Update the stored value
        const oldValue = data.original;
        data.original = newValue;
        const previousState = data.currentState;
        data.currentState = 'edited'; // Mark as edited
        this.obfuscatedElements.set(tokenId, data);
        
        // Always replace in the editor - if showing token, replace with new value
        // If showing original, replace old original with new value
        if (previousState === 'original' || previousState === 'edited') {
          // Was showing original value - replace old with new
          this.replaceSpecificTextInEditor(oldValue, newValue);
        } else {
          // Was showing as token - replace token with new edited value
          this.replaceTokenInEditor(tokenId, newValue);
        }
        
        this.showNotification(`Updated ${data.pattern.name} to: ${newValue}`, 3000);
        this.refreshPopup();
        
        // Reset processing flag after delay
        setTimeout(() => { this.isProcessing = false; }, 300);
      }
    }
  }

  useOriginalInPopup(tokenId) {
    const data = this.obfuscatedElements.get(tokenId);
    if (data) {
      // Set processing flag to prevent reprocessing
      this.isProcessing = true;
      
      // Mark as using original value
      data.currentState = 'original';
      this.obfuscatedElements.set(tokenId, data);
      
      // Replace in the current text editor
      this.replaceTokenInEditor(tokenId, data.original);
      this.refreshPopup();
      this.showNotification(`Restored: ${data.original}`, 2000);
      
      // Reset processing flag after delay
      setTimeout(() => { this.isProcessing = false; }, 300);
    }
  }
  
  removeTokenInPopup(tokenId) {
    const data = this.obfuscatedElements.get(tokenId);
    if (data) {
      // Set processing flag to prevent reprocessing
      this.isProcessing = true;
      
      // Mark as removed
      data.currentState = 'removed';
      this.obfuscatedElements.set(tokenId, data);
      
      // Remove from the current text editor
      this.replaceTokenInEditor(tokenId, '[REMOVED]');
      this.refreshPopup();
      this.showNotification('Token removed', 2000);
      
      // Reset processing flag after delay
      setTimeout(() => { this.isProcessing = false; }, 300);
    }
  }

  restoreTokenInPopup(tokenId) {
    const data = this.obfuscatedElements.get(tokenId);
    if (data) {
      // Set processing flag to prevent reprocessing
      this.isProcessing = true;
      
      // Get what's currently showing to replace it
      const currentlyShowing = this.getCurrentlyShowing(tokenId);
      
      // Clear the current state to restore to token
      delete data.currentState;
      this.obfuscatedElements.set(tokenId, data);
      
      // Replace whatever is currently showing with the token
      this.replaceSpecificTextInEditor(currentlyShowing, data.pattern.replacement);
      this.refreshPopup();
      this.showNotification(`Restored token: ${data.pattern.replacement}`, 2000);
      
      // Reset processing flag after delay
      setTimeout(() => { this.isProcessing = false; }, 300);
    }
  }

  replaceSpecificTextInEditor(oldText, newText) {
    // Replace specific text directly in the editor without token lookup
    const editor = this.findInputTarget(document.activeElement) || 
                   this.findInputTarget(document.querySelector('[contenteditable="true"]'));
    
    if (editor) {
      if (editor.tagName === 'INPUT' || editor.tagName === 'TEXTAREA') {
        let currentText = editor.value || '';
        if (currentText.includes(oldText)) {
          currentText = currentText.replace(oldText, newText);
          editor.value = currentText;
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        let currentText = editor.textContent || '';
        if (currentText.includes(oldText)) {
          const newFullText = currentText.replace(oldText, newText);
          editor.innerHTML = newFullText.replace(/\n/g, '<br>');
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  replaceTokenInEditor(tokenId, replacement) {
    // Find the editor and replace the specific token instance
    const editor = this.findInputTarget(document.activeElement) || 
                   this.findInputTarget(document.querySelector('[contenteditable="true"]'));
    
    if (editor) {
      const data = this.obfuscatedElements.get(tokenId);
      if (data) {
        if (editor.tagName === 'INPUT' || editor.tagName === 'TEXTAREA') {
          // For simple inputs
          let currentText = editor.value || '';
          
          // Try different replacement strategies
          const malformedMarker = `◆${data.pattern.replacement}◆${tokenId}◆`;
          
          if (currentText.includes(malformedMarker)) {
            // Replace malformed marker
            currentText = currentText.replace(malformedMarker, replacement);
          } else if (currentText.includes(data.pattern.replacement)) {
            // Replace clean token
            currentText = currentText.replace(data.pattern.replacement, replacement);
          } else if (currentText.includes(data.original)) {
            // Replace original value (when restoring from original to token)
            currentText = currentText.replace(data.original, replacement);
          }
          
          editor.value = currentText;
        } else {
          // For contentEditable, handle multiple replacement scenarios
          let currentText = editor.textContent || '';
          
          const malformedMarker = `◆${data.pattern.replacement}◆${tokenId}◆`;
          
          if (currentText.includes(malformedMarker)) {
            // Replace malformed marker
            const newText = currentText.replace(malformedMarker, replacement);
            editor.innerHTML = newText.replace(/\n/g, '<br>');
          } else if (currentText.includes(data.pattern.replacement)) {
            // Replace clean token
            const newText = currentText.replace(data.pattern.replacement, replacement);
            editor.innerHTML = newText.replace(/\n/g, '<br>');
          } else if (currentText.includes(data.original)) {
            // Replace original value (when restoring from original to token)
            const newText = currentText.replace(data.original, replacement);
            editor.innerHTML = newText.replace(/\n/g, '<br>');
          }
        }
        
        // Trigger events
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  refreshPopup() {
    // First try to update individual elements, fall back to full refresh
    let needsFullRefresh = false;
    
    this.obfuscatedElements.forEach((data, tokenId) => {
      const statusElement = document.getElementById(`currently-showing-${tokenId}`);
      const buttonsElement = document.getElementById(`buttons-${tokenId}`);
      
      if (statusElement && buttonsElement) {
        statusElement.textContent = `Currently showing: ${this.getCurrentlyShowing(tokenId)}`;
        buttonsElement.innerHTML = this.generateButtonsForState(tokenId, data);
      } else {
        needsFullRefresh = true;
      }
    });
    
    // Full refresh if we couldn't update individual elements
    if (needsFullRefresh) {
      this.closePopup();
      setTimeout(() => {
        if (this.obfuscatedElements.size > 0) {
          this.openSensitiveDataPopup();
        }
      }, 100);
    }
  }

  showNotification(message, duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.smart-dlp-notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'smart-dlp-notification';
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 16px 24px !important;
      border-radius: 12px !important;
      font-size: 14px !important;
      font-family: Arial, sans-serif !important;
      z-index: 9999999 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      max-width: 320px !important;
      transform: translateX(100%) !important;
      transition: transform 0.3s ease !important;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  useOriginalValue(tokenId) {
    const token = document.querySelector(`[data-token-id="${tokenId}"]`);
    const data = this.obfuscatedElements.get(tokenId);
    
    if (token && data) {
      token.outerHTML = data.original;
      this.obfuscatedElements.delete(tokenId);
      this.closePopup();
      if (this.obfuscatedElements.size > 0) {
        setTimeout(() => this.openSensitiveDataPopup(), 100);
      }
    }
  }

  deleteToken(tokenId) {
    const token = document.querySelector(`[data-token-id="${tokenId}"]`);
    if (token) {
      token.outerHTML = '[REMOVED]';
      this.obfuscatedElements.delete(tokenId);
      this.closePopup();
      if (this.obfuscatedElements.size > 0) {
        setTimeout(() => this.openSensitiveDataPopup(), 100);
      }
    }
  }

  findInputTarget(element) {
    const claudeSelectors = [
      '[contenteditable="true"].ProseMirror',
      '.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"]',
      '[role="textbox"]'
    ];
    
    for (const selector of claudeSelectors) {
      const found = document.querySelector(selector);
      if (found && found.offsetHeight > 20) {
        return found;
      }
    }
    
    let current = element;
    while (current && current !== document.body) {
      if (this.isInputElement(current) && current.offsetHeight > 20) {
        return current;
      }
      current = current.parentElement;
    }
    
    return element;
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
    return this.smartPatterns.some(pattern => pattern.regex.test(text));
  }

  processElementContent(element) {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      
      const originalContent = element.value || element.textContent || element.innerText || '';
      const processedResult = this.smartProcessText(originalContent);
      
      if (processedResult.hasChanges) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = processedResult.processedText;
        } else {
          element.innerHTML = processedResult.processedText.replace(/\n/g, '<br>');
          setTimeout(() => this.convertMarkersToTokens(element), 100);
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
        this.showSmartNotification(processedResult.detectedTypes);
      }
    } catch (error) {
      console.error('Firefox Smart DLP: Error processing element content:', error);
    } finally {
      setTimeout(() => { this.isProcessing = false; }, 100);
    }
  }

  showSmartNotification(detectedTypes) {
    const existing = document.querySelectorAll('.smart-dlp-notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'smart-dlp-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      z-index: 99999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
      max-width: 320px;
    `;
    
    const types = Array.from(detectedTypes).join(', ');
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <strong>Firefox Smart DLP Protection</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        Protected: ${types}
      </div>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
        Click the floating shield button to manage sensitive data
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.obfuscatedElements.clear();
  }
}

// Global access for token interactions
window.smartDLP = null;

// Initialize only once
if (!window.smartDLP) {
  window.smartDLP = new SmartEnterpriseDLP();
  console.log('Firefox Smart DLP: Advanced contextual protection initialized');
}