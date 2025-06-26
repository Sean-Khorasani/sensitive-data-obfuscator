// Obfuscation patterns and utilities
class ObfuscationPatterns {
  constructor() {
    this.patterns = {
      creditCard: {
        regex: /\b\d{4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}[\s-]*\d{2,4}\b/g,
        name: 'Credit Card',
        replacement: 'XXXX-XXXX-XXXX-XXXX',
        enabled: true,
        useAdvancedValidation: true
      },
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        name: 'Social Security Number',
        replacement: 'XXX-XX-XXXX',
        enabled: true,
        useAdvancedValidation: false
      },
      sin: {
        regex: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
        name: 'Social Insurance Number (Canada)',
        replacement: 'XXX-XXX-XXX',
        enabled: true,
        useAdvancedValidation: false
      },
      phone: {
        regex: /\b(?:\+?[\d]{1,3}[-.\s]?)?(?:\(?[\d]{2,4}\)?[-.\s]?){2,4}[\d]{2,4}\b/g,
        name: 'Phone Number',
        replacement: 'XXX XXX XXXX',
        enabled: true,
        useAdvancedValidation: false
      },
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        name: 'Email Address',
        replacement: 'user@example.com',
        enabled: true,
        useAdvancedValidation: false
      },
      ipAddress: {
        regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        name: 'IP Address',
        replacement: 'XXX.XXX.XXX.XXX',
        enabled: true,
        useAdvancedValidation: false
      },
      name: {
        regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        name: 'Full Name (Basic)',
        replacement: 'John Doe',
        enabled: false,
        useAdvancedValidation: false
      },
      accountNumber: {
        regex: /\b\d{7,17}\b/g,
        name: 'Account Number',
        replacement: 'XXXXXXXXX',
        enabled: true,
        useAdvancedValidation: false
      }
    };

    this.llmSites = [
      'chat.openai.com',
      'claude.ai',
      'bard.google.com',
      'bing.com',
      'you.com',
      'perplexity.ai',
      'character.ai',
      'poe.com',
      'huggingface.co',
      'replicate.com',
      'cohere.ai',
      'anthropic.com'
    ];
  }

  // Luhn algorithm for credit card validation
  luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
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

  // Check if current site is an LLM platform
  isLLMSite(hostname) {
    return this.llmSites.some(site => 
      hostname.includes(site) || hostname.endsWith(site)
    );
  }

  // Apply obfuscation to text
  obfuscateText(text, customPatterns = null) {
    let obfuscatedText = text;
    const patterns = customPatterns || this.patterns;

    Object.keys(patterns).forEach(key => {
      const pattern = patterns[key];
      if (!pattern.enabled) return;

      if (key === 'creditCard' && pattern.useAdvancedValidation) {
        // Use Luhn algorithm for credit card validation
        obfuscatedText = obfuscatedText.replace(pattern.regex, (match) => {
          if (this.luhnCheck(match)) {
            return pattern.replacement;
          }
          return match; // Don't replace if Luhn check fails
        });
      } else {
        obfuscatedText = obfuscatedText.replace(pattern.regex, pattern.replacement);
      }
    });

    return obfuscatedText;
  }

  // Get default patterns
  getDefaultPatterns() {
    return JSON.parse(JSON.stringify(this.patterns));
  }

  // Get default LLM sites
  getDefaultLLMSites() {
    return [...this.llmSites];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObfuscationPatterns;
} else if (typeof window !== 'undefined') {
  window.ObfuscationPatterns = ObfuscationPatterns;
}

