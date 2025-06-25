const LLMProviderFactory = require('../providers/factory');

class ReceiptService {
  constructor() {
    this.llmProvider = LLMProviderFactory.createProvider('gemini');
  }

  getReceiptTemplates() {
    return {
      bale: {
        supplier: null,
        date: null,
        weight: null,
        price_per_unit: null,
        total_amount: null,
        receipt_number: null,
        items: []
      },
      popup_collection: {
        collection_point: null,
        date: null,
        time: null,
        collector_name: null,
        items_collected: [],
        total_weight: null,
        receipt_number: null
      },
      weigh_bridge: {
        receipt_numbers: [],
        date_time: null,
        vehicle_number: null,
        company: null,
        location: null,
        gross_weight: null,
        tare_weight: null,
        nett_weight: null,
        operator: null,
        remarks: null
      }
    };
  }

  async processReceipt(imageBuffer, receiptType) {
    const templates = this.getReceiptTemplates();
    const template = templates[receiptType];
    
    if (!template) {
      throw new Error(`Unsupported receipt type: ${receiptType}`);
    }

    const prompt = `Please extract information from this ${receiptType.replace('_', ' ')} receipt image and fill in the provided JSON format.`;
    
    try {
      const result = await this.llmProvider.processImage(imageBuffer, prompt, template);
      return {
        success: true,
        data: result,
        receiptType: receiptType
      };
    } catch (error) {
      throw new Error(`Receipt processing failed: ${error.message}`);
    }
  }

  switchProvider(providerType) {
    this.llmProvider = LLMProviderFactory.createProvider(providerType);
  }
}

module.exports = ReceiptService;