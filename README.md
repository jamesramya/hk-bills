# Receipt OCR Backend

A Node.js backend service that processes receipt images using Google Gemini LLM for OCR extraction. Supports Mandarin and English receipts with four types: Bale Receipt, Pop up Collection Receipt, Weigh Bridge Receipt, and Purchase Receipt.

## Data Format Standards
- **Weights/Volumes/Values**: Separated into value and unit objects (e.g., `{"value": 150, "unit": "KG"}`)
- **Dates**: ISO format YYYY-MM-DDTHH:MM:SSZ (e.g., `"2025-06-17T14:57:00Z"`)
- **Multiple Receipts**: Each receipt gets its own complete JSON object

## Features

- **Modular LLM Provider Architecture** - Easy to switch between different LLM providers
- **Google Gemini Integration** - OCR processing with multilingual support
- **Responsive Frontend** - Image upload with drag & drop functionality
- **REST API** - Clean API endpoints for receipt processing
- **Production Ready** - Error handling, validation, and rate limiting
- **Multiple Deployment Options** - Railway, Render, Vercel configurations included

## Quick Start

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Add your Google Gemini API key to `.env`:
   ```
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/receipts/types` - Get available receipt types and templates
- `POST /api/receipts/process` - Process receipt image
- `GET /api/receipts/health` - Health check

## Mobile Developer Integration

📱 **For mobile developers:** See [API_INTEGRATION.md](./API_INTEGRATION.md) for comprehensive Flutter integration guide with code examples, error handling, and best practices.

## Receipt Types

### Bale Receipt
```json
{
  "supplier": null,
  "date": null,
  "weight": {
    "value": null,
    "unit": null
  },
  "price_per_unit": {
    "value": null,
    "unit": null
  },
  "total_amount": {
    "value": null,
    "unit": null
  },
  "receipt_number": null,
  "items": []
}
```

### Pop up Collection Receipt
```json
{
  "collection_point": null,
  "date_time": null,
  "collector_name": null,
  "items_collected": [],
  "total_weight": {
    "value": null,
    "unit": null
  },
  "receipt_number": null
}
```

### Weigh Bridge Receipt
```json
{
  "receipt_numbers": [],
  "date_time": null,
  "vehicle_number": null,
  "company": null,
  "location": null,
  "gross_weight": {
    "value": null,
    "unit": null
  },
  "tare_weight": {
    "value": null,
    "unit": null
  },
  "nett_weight": {
    "value": null,
    "unit": null
  },
  "operator": null,
  "remarks": null
}
```

### Purchase Receipt
```json
{
  "receipt_numbers": [],
  "date_time": null,
  "collector": null,
  "collected_location": null,
  "pet_volume": {
    "value": null,
    "unit": null
  },
  "mode_of_transportation": null,
  "dww_code": null,
  "cleaner_name": null,
  "material_value": {
    "value": null,
    "unit": null
  },
  "storage": null
}
```

## Deployment

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variable: `GOOGLE_GEMINI_API_KEY`
3. Deploy automatically with `railway.json` configuration

### Render
1. Connect your GitHub repository to Render
2. Set environment variable: `GOOGLE_GEMINI_API_KEY`
3. Deploy with `render.yaml` configuration

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variable: `GOOGLE_GEMINI_API_KEY`

## Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

## Project Structure

```
src/
├── config/         # Configuration files
├── middleware/     # Express middleware
├── providers/      # LLM provider implementations
├── routes/         # API routes
├── services/       # Business logic
└── server.js       # Main server file

public/             # Frontend static files
```

## Adding New LLM Providers

1. Create a new provider class extending `BaseLLMProvider`
2. Implement `processImage` and `validateConfig` methods
3. Add to `LLMProviderFactory`
4. Update configuration as needed

## License

MIT