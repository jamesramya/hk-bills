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

Expected JSON format for EACH receipt:
${JSON.stringify(expectedFormat, null, 2)}

Instructions:
1. Extract text from the receipt image using OCR
2. Identify how many separate receipts are in the image
3. If there is only ONE receipt, return a single JSON object following the format above
4. If there are MULTIPLE receipts, return an array of JSON objects, where each object represents one receipt
5. Map the extracted information from each receipt to the provided JSON format
6. Keep field values in their original language (Mandarin/English) from the image
7. For WEIGHT/VOLUME/VALUE fields: separate numeric value from units (e.g., "150 KG" becomes {"value": 150, "unit": "KG"}, "50 HKD" becomes {"value": 50, "unit": "HKD"})
8. For DATE/TIME fields: convert to ISO format YYYY-MM-DDTHH:MM:SSZ (e.g., "2025/06/17 14:57" becomes "2025-06-17T14:57:00Z")
9. If a field cannot be found in a receipt, use null as the value
10. Return ONLY the JSON (single object or array of objects), no additional text
11. Ensure the response is valid JSON

Examples:
- Single receipt: return { "field1": "value1", ... }
- Multiple receipts: return [{ "field1": "value1", ... }, { "field1": "value2", ... }]
- Weight/Volume/Value format: {"value": 150, "unit": "KG"} or {"value": 50, "unit": "HKD"}
- Date format: "2025-06-17T14:57:00Z"`;

      const result = await this.model.generateContent([fullPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to extract only JSON (object or array)
      const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Ensure we always return an array for consistency
      if (Array.isArray(parsedResult)) {
        return parsedResult;
      } else {
        return [parsedResult]; // Wrap single receipt in array
      }
    } catch (error) {
      throw new Error(`Gemini processing failed: ${error.message}`);
    }
  }
}

module.exports = GeminiProvider;