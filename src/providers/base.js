class BaseLLMProvider {
  constructor() {
    if (this.constructor === BaseLLMProvider) {
      throw new Error('BaseLLMProvider is an abstract class and cannot be instantiated');
    }
  }

  async processImage(imageBuffer, prompt, expectedFormat) {
    throw new Error('processImage method must be implemented by subclass');
  }

  validateConfig() {
    throw new Error('validateConfig method must be implemented by subclass');
  }
}

module.exports = BaseLLMProvider;