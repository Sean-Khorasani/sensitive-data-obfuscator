// Advanced Data Loss Prevention (DLP) module
// Enhanced detection and obfuscation techniques

class AdvancedDLP {
  constructor() {
    this.contextualKeywords = {
      creditCard: [
        'credit card', 'card number', 'cc', 'visa', 'mastercard', 'amex', 'american express',
        'discover', 'card', 'payment', 'billing', 'charge'
      ],
      ssn: [
        'ssn', 'social security', 'social security number', 'ss#', 'social'
      ],
      sin: [
        'sin', 'social insurance', 'social insurance number', 'si#'
      ],
      phone: [
        'phone', 'telephone', 'mobile', 'cell', 'contact', 'call', 'number'
      ],
      email: [
        'email', 'e-mail', 'contact', 'address', 'mail'
      ],
      address: [
        'address', 'street', 'avenue', 'road', 'lane', 'drive', 'boulevard',
        'apt', 'apartment', 'suite', 'unit', 'zip', 'postal'
      ],
      name: [
        'name', 'first name', 'last name', 'full name', 'given name', 'surname'
      ]
    };

    this.enhancedPatterns = {
      creditCard: {
        // Enhanced credit card patterns with brand detection
        visa: /\b4[0-9]{12}(?:[0-9]{3})?\b/g,
        mastercard: /\b5[1-5][0-9]{14}\b/g,
        amex: /\b3[47][0-9]{13}\b/g,
        discover: /\b6(?:011|5[0-9]{2})[0-9]{12}\b/g,
        generic: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g
      },
      
      phone: {
        // International and domestic phone patterns
        us: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        formatted: /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g,
        // General phone pattern supporting varied spacing or separators
        international: /\b(?:\+?[0-9]{1,3}[-.\s]?)?(?:\(?[0-9]{2,4}\)?[-.\s]?){2,4}[0-9]{2,4}\b/g
      },
      
      email: {
        standard: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        strict: /\b[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/g
      },
      
      ssn: {
        formatted: /\b\d{3}-\d{2}-\d{4}\b/g,
        unformatted: /\b\d{9}\b/g,
        spaced: /\b\d{3}\s\d{2}\s\d{4}\b/g
      },
      
      sin: {
        formatted: /\b\d{3}[-\s]\d{3}[-\s]\d{3}\b/g,
        unformatted: /\b\d{9}\b/g
      },
      
      address: {
        streetNumber: /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Circle|Cir|Court|Ct|Place|Pl)\b/gi,
        zipCode: /\b\d{5}(?:-\d{4})?\b/g,
        postalCode: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi
      },
      
      ipAddress: {
        ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g
      },
      
      name: {
        fullName: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g,
        titleName: /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+ [A-Z][a-z]+\b/g
      },
      
      financial: {
        bankAccount: /\b\d{8,17}\b/g,
        routingNumber: /\b\d{9}\b/g,
        iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g
      }
    };

    this.replacementTemplates = {
      creditCard: {
        visa: 'XXXX-XXXX-XXXX-XXXX',
        mastercard: 'XXXX-XXXX-XXXX-XXXX',
        amex: 'XXXX-XXXXXX-XXXXX',
        discover: 'XXXX-XXXX-XXXX-XXXX',
        generic: 'XXXX-XXXX-XXXX-XXXX'
      },
      phone: {
        us: '(XXX) XXX-XXXX',
        international: 'XXX XXX XXXX',
        formatted: '(XXX) XXX-XXXX'
      },
      email: {
        standard: 'user@example.com',
        domain: 'example.com'
      },
      ssn: 'XXX-XX-XXXX',
      sin: 'XXX-XXX-XXX',
      address: {
        street: 'XXX Main Street',
        zipCode: 'XXXXX',
        postalCode: 'XXX XXX'
      },
      name: {
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe'
      },
      financial: {
        bankAccount: 'XXXXXXXXX',
        routingNumber: 'XXXXXXXXX',
        iban: 'XXXX XXXX XXXX XXXX XXXX XX'
      }
    };
  }

  // Enhanced Luhn algorithm with additional validation
  validateCreditCard(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    
    // Check length
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Detect credit card brand
  detectCreditCardBrand(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^6(?:011|5)/.test(digits)) return 'discover';
    
    return 'generic';
  }

  // Contextual analysis to reduce false positives
  analyzeContext(text, match, dataType) {
    const contextWindow = 50; // Characters before and after the match
    const matchIndex = text.indexOf(match);
    const start = Math.max(0, matchIndex - contextWindow);
    const end = Math.min(text.length, matchIndex + match.length + contextWindow);
    const context = text.substring(start, end).toLowerCase();
    
    const keywords = this.contextualKeywords[dataType] || [];
    const keywordFound = keywords.some(keyword => context.includes(keyword.toLowerCase()));
    
    // Additional context checks
    const contextChecks = {
      creditCard: () => {
        // Check for credit card indicators
        return keywordFound || 
               /payment|billing|card|purchase|transaction/.test(context) ||
               /\b(exp|expir|cvv|cvc)\b/.test(context);
      },
      
      ssn: () => {
        // Check for SSN indicators
        return keywordFound || 
               /social|security|tax|government|id/.test(context);
      },
      
      phone: () => {
        // Check for phone indicators
        return keywordFound || 
               /call|contact|mobile|tel|phone/.test(context) ||
               /\b(ext|extension)\b/.test(context);
      },
      
      email: () => {
        // Email is usually self-evident
        return true;
      },
      
      address: () => {
        // Check for address indicators
        return keywordFound || 
               /address|street|city|state|zip|postal|mail/.test(context);
      }
    };
    
    const checker = contextChecks[dataType];
    return checker ? checker() : keywordFound;
  }

  // Advanced pattern matching with contextual analysis
  detectSensitiveData(text, options = {}) {
    const detections = [];
    const useContextualAnalysis = options.useContextualAnalysis || false;
    const strictMode = options.strictMode || false;
    
    // Credit card detection
    Object.entries(this.enhancedPatterns.creditCard).forEach(([brand, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const cardNumber = match[0];
        
        // Validate with Luhn algorithm if enabled
        if (options.useLuhnValidation && !this.validateCreditCard(cardNumber)) {
          return;
        }
        
        // Contextual analysis
        if (useContextualAnalysis && !this.analyzeContext(text, cardNumber, 'creditCard')) {
          return;
        }
        
        detections.push({
          type: 'creditCard',
          subtype: brand,
          value: cardNumber,
          index: match.index,
          confidence: this.calculateConfidence('creditCard', cardNumber, text, match.index)
        });
      });
    });
    
    // Phone number detection
    Object.entries(this.enhancedPatterns.phone).forEach(([type, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const phoneNumber = match[0];
        
        // Contextual analysis
        if (useContextualAnalysis && !this.analyzeContext(text, phoneNumber, 'phone')) {
          return;
        }
        
        detections.push({
          type: 'phone',
          subtype: type,
          value: phoneNumber,
          index: match.index,
          confidence: this.calculateConfidence('phone', phoneNumber, text, match.index)
        });
      });
    });
    
    // Email detection
    const emailPattern = strictMode ? 
      this.enhancedPatterns.email.strict : 
      this.enhancedPatterns.email.standard;
      
    const emailMatches = [...text.matchAll(emailPattern)];
    emailMatches.forEach(match => {
      const email = match[0];
      
      detections.push({
        type: 'email',
        subtype: 'standard',
        value: email,
        index: match.index,
        confidence: this.calculateConfidence('email', email, text, match.index)
      });
    });
    
    // SSN detection
    Object.entries(this.enhancedPatterns.ssn).forEach(([format, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const ssn = match[0];
        
        // Additional validation for unformatted SSN
        if (format === 'unformatted') {
          // Check if it's not just any 9-digit number
          if (!useContextualAnalysis || this.analyzeContext(text, ssn, 'ssn')) {
            detections.push({
              type: 'ssn',
              subtype: format,
              value: ssn,
              index: match.index,
              confidence: this.calculateConfidence('ssn', ssn, text, match.index)
            });
          }
        } else {
          detections.push({
            type: 'ssn',
            subtype: format,
            value: ssn,
            index: match.index,
            confidence: this.calculateConfidence('ssn', ssn, text, match.index)
          });
        }
      });
    });
    
    // Additional patterns (SIN, addresses, etc.)
    this.detectAdditionalPatterns(text, detections, options);
    
    return detections.sort((a, b) => a.index - b.index);
  }

  detectAdditionalPatterns(text, detections, options) {
    // SIN detection
    Object.entries(this.enhancedPatterns.sin).forEach(([format, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        detections.push({
          type: 'sin',
          subtype: format,
          value: match[0],
          index: match.index,
          confidence: this.calculateConfidence('sin', match[0], text, match.index)
        });
      });
    });
    
    // Address detection
    Object.entries(this.enhancedPatterns.address).forEach(([type, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        if (!options.useContextualAnalysis || this.analyzeContext(text, match[0], 'address')) {
          detections.push({
            type: 'address',
            subtype: type,
            value: match[0],
            index: match.index,
            confidence: this.calculateConfidence('address', match[0], text, match.index)
          });
        }
      });
    });
    
    // IP address detection
    Object.entries(this.enhancedPatterns.ipAddress).forEach(([version, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        detections.push({
          type: 'ipAddress',
          subtype: version,
          value: match[0],
          index: match.index,
          confidence: this.calculateConfidence('ipAddress', match[0], text, match.index)
        });
      });
    });
    
    // Name detection (if enabled)
    if (options.detectNames) {
      Object.entries(this.enhancedPatterns.name).forEach(([type, pattern]) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          if (!options.useContextualAnalysis || this.analyzeContext(text, match[0], 'name')) {
            detections.push({
              type: 'name',
              subtype: type,
              value: match[0],
              index: match.index,
              confidence: this.calculateConfidence('name', match[0], text, match.index)
            });
          }
        });
      });
    }
  }

  calculateConfidence(type, value, text, index) {
    let confidence = 0.5; // Base confidence
    
    // Type-specific confidence adjustments
    switch (type) {
      case 'creditCard':
        confidence = 0.8;
        if (this.validateCreditCard(value)) confidence += 0.15;
        break;
        
      case 'email':
        confidence = 0.9; // Emails are usually obvious
        break;
        
      case 'phone':
        confidence = 0.7;
        if (/^\+/.test(value)) confidence += 0.1; // International format
        if (/\(\d{3}\)/.test(value)) confidence += 0.1; // Formatted
        break;
        
      case 'ssn':
        confidence = 0.8;
        if (/\d{3}-\d{2}-\d{4}/.test(value)) confidence += 0.1; // Formatted
        break;
        
      case 'address':
        confidence = 0.6;
        break;
        
      case 'name':
        confidence = 0.4; // Names are harder to detect accurately
        break;
        
      default:
        confidence = 0.6;
    }
    
    // Contextual confidence boost
    const contextWindow = 30;
    const start = Math.max(0, index - contextWindow);
    const end = Math.min(text.length, index + value.length + contextWindow);
    const context = text.substring(start, end).toLowerCase();
    
    const keywords = this.contextualKeywords[type] || [];
    const keywordMatches = keywords.filter(keyword => 
      context.includes(keyword.toLowerCase())
    ).length;
    
    confidence += Math.min(keywordMatches * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  // Advanced obfuscation with multiple strategies
  obfuscateDetections(text, detections, options = {}) {
    let obfuscatedText = text;
    let offset = 0;
    
    detections.forEach(detection => {
      const { type, subtype, value, index, confidence } = detection;
      
      // Skip low-confidence detections if strict mode is enabled
      if (options.strictMode && confidence < 0.7) {
        return;
      }
      
      const adjustedIndex = index + offset;
      const replacement = this.getReplacement(type, subtype, value, options);
      
      obfuscatedText = obfuscatedText.substring(0, adjustedIndex) + 
                     replacement + 
                     obfuscatedText.substring(adjustedIndex + value.length);
      
      offset += replacement.length - value.length;
    });
    
    return obfuscatedText;
  }

  getReplacement(type, subtype, originalValue, options = {}) {
    const obfuscationMode = options.obfuscationMode || 'substitute';
    
    switch (obfuscationMode) {
      case 'mask':
        return this.maskValue(type, originalValue);
        
      case 'substitute':
        return this.getSubstitutionValue(type, subtype, options);
        
      case 'remove':
        return '[REDACTED]';
        
      case 'placeholder':
        return `[${type.toUpperCase()}]`;
        
      default:
        return this.getSubstitutionValue(type, subtype, options);
    }
  }

  maskValue(type, value) {
    switch (type) {
      case 'creditCard':
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 4) {
          const lastFour = digits.slice(-4);
          const masked = 'X'.repeat(digits.length - 4) + lastFour;
          return this.formatMaskedValue(masked, value);
        }
        return 'XXXX-XXXX-XXXX-XXXX';
        
      case 'phone':
        return value.replace(/\d/g, 'X');
        
      case 'email':
        const [username, domain] = value.split('@');
        const maskedUsername = username.charAt(0) + 'X'.repeat(username.length - 1);
        return `${maskedUsername}@${domain}`;
        
      case 'ssn':
        return value.replace(/\d/g, 'X');
        
      default:
        return value.replace(/[A-Za-z0-9]/g, 'X');
    }
  }

  formatMaskedValue(masked, original) {
    // Preserve original formatting
    let formatted = '';
    let maskedIndex = 0;
    
    for (let i = 0; i < original.length; i++) {
      if (/\d/.test(original[i])) {
        formatted += masked[maskedIndex++] || 'X';
      } else {
        formatted += original[i];
      }
    }
    
    return formatted;
  }

  getSubstitutionValue(type, subtype, options) {
    const templates = this.replacementTemplates[type];
    
    if (typeof templates === 'object' && templates[subtype]) {
      return templates[subtype];
    } else if (typeof templates === 'string') {
      return templates;
    }
    
    // Fallback substitutions
    const fallbacks = {
      creditCard: 'XXXX-XXXX-XXXX-XXXX',
      phone: '(XXX) XXX-XXXX',
      email: 'user@example.com',
      ssn: 'XXX-XX-XXXX',
      sin: 'XXX-XXX-XXX',
      address: 'XXX Main Street',
      name: 'John Doe',
      ipAddress: 'XXX.XXX.XXX.XXX'
    };
    
    return fallbacks[type] || '[REDACTED]';
  }

  // Main processing function
  processText(text, settings = {}) {
    const options = {
      useLuhnValidation: settings.useLuhnValidation || false,
      useContextualAnalysis: settings.useContextualAnalysis || false,
      strictMode: settings.strictMode || false,
      detectNames: settings.detectNames || false,
      obfuscationMode: settings.obfuscationMode || 'substitute',
      enabledTypes: settings.enabledTypes || ['creditCard', 'phone', 'email', 'ssn', 'sin']
    };
    
    // Detect sensitive data
    const detections = this.detectSensitiveData(text, options);
    
    // Filter by enabled types
    const filteredDetections = detections.filter(detection => 
      options.enabledTypes.includes(detection.type)
    );
    
    // Obfuscate the text
    return this.obfuscateDetections(text, filteredDetections, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedDLP;
} else if (typeof window !== 'undefined') {
  window.AdvancedDLP = AdvancedDLP;
}

