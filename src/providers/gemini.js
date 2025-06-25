const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseLLMProvider = require('./base');
const config = require('../config/config');

class GeminiProvider extends BaseLLMProvider {
  constructor() {
    super();
    this.validateConfig();
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  validateConfig() {
    if (!config.gemini.apiKey) {
      console.warn('Warning: Google Gemini API key is not set. Set GOOGLE_GEMINI_API_KEY environment variable.');
      // Don't throw error on startup, handle it at request time
    }
  }

  async processImage(imageBuffer, prompt, expectedFormat) {
    if (!config.gemini.apiKey) {
      throw new Error('Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY environment variable.');
    }
    
    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const fullPrompt = `${prompt}

Expected JSON format:
${JSON.stringify(expectedFormat, null, 2)}

Instructions:
1. Extract text from the receipt image using OCR
2. Map the extracted information to the provided JSON format
3. Keep field values in their original language (Mandarin/English) from the image
4. Return ONLY the filled JSON object, no additional text
5. If a field cannot be found, use null as the value
6. Ensure the response is valid JSON`;

      const result = await this.model.generateContent([fullPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to extract only JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Gemini processing failed: ${error.message}`);
    }
  }
}

module.exports = GeminiProvider;