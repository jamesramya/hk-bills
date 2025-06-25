const GeminiProvider = require('./gemini');

class LLMProviderFactory {
  static createProvider(providerType = 'gemini') {
    switch (providerType.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      default:
        throw new Error(`Unsupported LLM provider: ${providerType}`);
    }
  }

  static getSupportedProviders() {
    return ['gemini'];
  }
}

module.exports = LLMProviderFactory;