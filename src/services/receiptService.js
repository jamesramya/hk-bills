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
        weight: {
          value: null,
          unit: null
        },
        price_per_unit: {
          value: null,
          unit: null
        },
        total_amount: {
          value: null,
          unit: null
        },
        receipt_number: null,
        items: []
      },
      popup_collection: {
        collection_point: null,
        date_time: null,
        collector_name: null,
        items_collected: [],
        total_weight: {
          value: null,
          unit: null
        },
        receipt_number: null
      },
      weigh_bridge: {
        receipt_numbers: [],
        date_time: null,
        vehicle_number: null,
        company: null,
        location: null,
        gross_weight: {
          value: null,
          unit: null
        },
        tare_weight: {
          value: null,
          unit: null
        },
        nett_weight: {
          value: null,
          unit: null
        },
        operator: null,
        remarks: null
      },
      purchase: {
        receipt_numbers: [],
        date_time: null,
        collector: null,
        collected_location: null,
        pet_volume: {
          value: null,
          unit: null
        },
        mode_of_transportation: null,
        dww_code: null,
        cleaner_name: null,
        material_value: {
          value: null,
          unit: null
        },
        storage: null
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
      const results = await this.llmProvider.processImage(imageBuffer, prompt, template);
      
      return {
        success: true,
        data: results, // Now an array of receipt objects
        receiptType: receiptType,
        count: results.length
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