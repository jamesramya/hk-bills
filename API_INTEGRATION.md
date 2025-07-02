# API Integration Guide for Mobile Developers

## Overview
This document provides comprehensive integration guidelines for mobile developers working with the Receipt OCR API. This is a prototype system designed for testing receipt processing capabilities.

## Base URL
```
https://hk-bills-production.up.railway.app
```

## Authentication
**No authentication required** - This is a prototype system.

## API Endpoints

### 1. Get Receipt Types & Templates
**Endpoint:** `GET /api/receipts/types`

**Response:**
```json
{
  "success": true,
  "data": {
    "types": ["bale", "popup_collection", "weigh_bridge", "purchase"],
    "templates": {
      "bale": { /* template structure */ },
      "popup_collection": { /* template structure */ },
      "weigh_bridge": { /* template structure */ },
      "purchase": { /* template structure */ }
    }
  }
}
```

### 2. Process Receipt Image

The API supports **two methods** for uploading images:

#### Method 1: Multipart File Upload
**Endpoint:** `POST /api/receipts/process`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image`: File (JPEG/PNG/WebP, max 10MB)
- `receiptType`: String (one of: `bale`, `popup_collection`, `weigh_bridge`, `purchase`)

#### Method 2: Base64 Image Upload
**Endpoint:** `POST /api/receipts/process`

**Content-Type:** `application/json`

**Parameters:**
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "receiptType": "weigh_bridge"
}
```

**Base64 Format Options:**
- **Data URL format** (recommended): `"data:image/png;base64,<base64_data>"`
- **Plain base64**: Just the base64 string (assumes PNG format)

**Supported formats:** JPEG, PNG, WebP  
**Maximum size:** 10MB

**Response (same for both methods):**
```json
{
  "success": true,
  "data": [
    {
      "receipt_numbers": ["12345", "67890"],
      "date_time": "2025-06-17T14:57:00Z",
      "gross_weight": {
        "value": 150,
        "unit": "KG"
      },
      "company": "ABC Transport Ltd"
    }
  ],
  "receiptType": "weigh_bridge",
  "count": 1,
  "imageSize": 2048576,
  "processedAt": "2025-06-25T10:30:00Z"
}
```

### 3. Health Check
**Endpoint:** `GET /api/receipts/health`

(Root level `GET /health` is also available for quick status checks.)

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-06-25T10:30:00Z"
}
```

## Receipt Types & Templates

### Bale Receipt
```json
{
  "supplier": null,
  "date": null,
  "weight": { "value": null, "unit": null },
  "price_per_unit": { "value": null, "unit": null },
  "total_amount": { "value": null, "unit": null },
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
  "total_weight": { "value": null, "unit": null },
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
  "gross_weight": { "value": null, "unit": null },
  "tare_weight": { "value": null, "unit": null },
  "nett_weight": { "value": null, "unit": null },
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
  "pet_volume": { "value": null, "unit": null },
  "mode_of_transportation": null,
  "dww_code": null,
  "cleaner_name": null,
  "material_value": { "value": null, "unit": null },
  "storage": null
}
```

## Flutter Integration Examples

### Setup Dependencies
Add to your `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
  # or alternatively:
  dio: ^5.3.2
```

### Using HTTP Package
```dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ReceiptAPI {
  static const String baseUrl = 'https://hk-bills-production.up.railway.app';
  
  // Get receipt types
  static Future<Map<String, dynamic>> getReceiptTypes() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/receipts/types'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load receipt types');
    }
  }
  
  // Method 1: Process receipt image using multipart upload
  static Future<Map<String, dynamic>> processReceiptMultipart({
    required File imageFile,
    required String receiptType,
  }) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/api/receipts/process'),
    );
    
    // Add fields
    request.fields['receiptType'] = receiptType;
    
    // Add file
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );
    
    // Send request
    var streamedResponse = await request.send().timeout(
      const Duration(seconds: 60), // Long timeout for processing
    );
    
    var response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to process receipt: ${response.body}');
    }
  }
  
  // Method 2: Process receipt image using base64 upload
  static Future<Map<String, dynamic>> processReceiptBase64({
    required File imageFile,
    required String receiptType,
  }) async {
    // Convert image to base64
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);
    
    // Determine MIME type from file extension
    String mimeType = 'image/png';
    final extension = imageFile.path.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }
    
    // Create data URL format
    final dataUrl = 'data:$mimeType;base64,$base64Image';
    
    final response = await http.post(
      Uri.parse('$baseUrl/api/receipts/process'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'imageBase64': dataUrl,
        'receiptType': receiptType,
      }),
    ).timeout(const Duration(seconds: 60));
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to process receipt: ${response.body}');
    }
  }
  
  // Convenience method that tries base64 first, falls back to multipart
  static Future<Map<String, dynamic>> processReceipt({
    required File imageFile,
    required String receiptType,
  }) async {
    try {
      // Try base64 method first (better for mobile)
      return await processReceiptBase64(
        imageFile: imageFile,
        receiptType: receiptType,
      );
    } catch (e) {
      // Fallback to multipart if base64 fails
      print('Base64 upload failed, trying multipart: $e');
      return await processReceiptMultipart(
        imageFile: imageFile,
        receiptType: receiptType,
      );
    }
  }
}
```

### Using Dio Package
```dart
import 'package:dio/dio.dart';
import 'dart:io';
import 'dart:convert';

class ReceiptAPIDio {
  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'https://hk-bills-production.up.railway.app',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 60), // Long timeout for processing
    ),
  );
  
  // Method 1: Multipart upload
  static Future<Map<String, dynamic>> processReceiptMultipart({
    required File imageFile,
    required String receiptType,
  }) async {
    FormData formData = FormData.fromMap({
      'receiptType': receiptType,
      'image': await MultipartFile.fromFile(
        imageFile.path,
        filename: 'receipt.jpg',
      ),
    });
    
    try {
      Response response = await _dio.post(
        '/api/receipts/process',
        data: formData,
      );
      
      return response.data;
    } catch (e) {
      throw Exception('Failed to process receipt: $e');
    }
  }
  
  // Method 2: Base64 upload
  static Future<Map<String, dynamic>> processReceiptBase64({
    required File imageFile,
    required String receiptType,
  }) async {
    // Convert image to base64
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);
    
    // Determine MIME type from file extension
    String mimeType = 'image/png';
    final extension = imageFile.path.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }
    
    final dataUrl = 'data:$mimeType;base64,$base64Image';
    
    try {
      Response response = await _dio.post(
        '/api/receipts/process',
        data: {
          'imageBase64': dataUrl,
          'receiptType': receiptType,
        },
        options: Options(
          headers: {'Content-Type': 'application/json'},
        ),
      );
      
      return response.data;
    } catch (e) {
      throw Exception('Failed to process receipt: $e');
    }
  }
  
  // Convenience method with fallback
  static Future<Map<String, dynamic>> processReceipt({
    required File imageFile,
    required String receiptType,
  }) async {
    try {
      // Try base64 method first
      return await processReceiptBase64(
        imageFile: imageFile,
        receiptType: receiptType,
      );
    } catch (e) {
      // Fallback to multipart
      print('Base64 upload failed, trying multipart: $e');
      return await processReceiptMultipart(
        imageFile: imageFile,
        receiptType: receiptType,
      );
    }
  }
}
```

### Usage Example in Widget
```dart
class ReceiptProcessorWidget extends StatefulWidget {
  @override
  _ReceiptProcessorWidgetState createState() => _ReceiptProcessorWidgetState();
}

class _ReceiptProcessorWidgetState extends State<ReceiptProcessorWidget> {
  bool _isProcessing = false;
  Map<String, dynamic>? _result;
  
  Future<void> _processReceipt(File imageFile, String receiptType) async {
    setState(() {
      _isProcessing = true;
      _result = null;
    });
    
    try {
      final result = await ReceiptAPI.processReceipt(
        imageFile: imageFile,
        receiptType: receiptType,
      );
      
      setState(() {
        _result = result;
      });
      
      // Handle successful result
      if (result['success']) {
        print('Processed ${result['count']} receipt(s)');
        print('Data: ${result['data']}');
      }
      
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_isProcessing)
          const CircularProgressIndicator(),
        
        if (_result != null)
          Text('Result: ${_result!['data']}'),
        
        // Your UI components here
      ],
    );
  }
}
```

## Data Format Standards

### Date/Time Fields
- **Format:** ISO 8601 format `YYYY-MM-DDTHH:MM:SSZ`
- **Example:** `"2025-06-17T14:57:00Z"`
- **Parsing in Dart:**
```dart
DateTime dateTime = DateTime.parse(result['date_time']);
```

### Weight/Volume/Value Fields
- **Format:** Object with `value` and `unit` properties
- **Example:** `{"value": 150, "unit": "KG"}`
- **Parsing in Dart:**
```dart
double weight = result['gross_weight']['value'].toDouble();
String unit = result['gross_weight']['unit'];
```

### Multiple Receipts
- **Data Structure:** Always returns an array, even for single receipts
- **Access:** `result['data'][0]` for first receipt
- **Count:** `result['count']` for total number of receipts

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Scenarios
1. **Missing image file** (400 status)
   - `"Image file is required"`
2. **Invalid file format** (400 status)
   - `"Invalid file type. Only JPEG, PNG, and WebP images are allowed"`
3. **File too large** (400 status)
   - `"File size exceeds limit of 10MB"`
4. **Invalid receipt type** (400 status)
   - `"Invalid receipt type. Valid types are: bale, popup_collection, weigh_bridge, purchase"`
5. **Image processing failure** (400 status)
   - `"Invalid or corrupted image file. Please use a valid JPEG, PNG, or WebP image"`
6. **Rate limit exceeded** (429 status)
   - `"Too many requests. Please try again later"`
7. **Server errors** (500 status)
   - `"Receipt processing failed: [specific error message]"`

### Flutter Error Handling Example
```dart
try {
  final result = await ReceiptAPI.processReceipt(
    imageFile: imageFile,
    receiptType: receiptType,
  );
} on TimeoutException {
  // Handle timeout
  showError('Processing timeout. Please try again.');
} on SocketException {
  // Handle network issues
  showError('Network error. Check your connection.');
} catch (e) {
  // Handle other errors
  showError('Error: $e');
}
```

## Rate Limiting
- **Limit:** 100 requests per 15-minute window per IP address
- **Response:** 429 status code when exceeded
- **Recommendation:** Implement retry logic with exponential backoff

## Performance Considerations

### Image Optimization
- **Compress images** before upload to reduce processing time
- **Recommended size:** 1-2MB for optimal balance
- **Resolution:** 1080p or higher for better OCR accuracy

### Processing Time
- **Expected duration:** 5-30 seconds depending on image complexity
- **Multiple receipts:** May take longer
- **UI recommendation:** Show progress indicator with estimated time

### Flutter Best Practices
```dart
// Compress image before upload
import 'package:image/image.dart' as img;

File compressImage(File file) {
  final image = img.decodeImage(file.readAsBytesSync())!;
  final compressed = img.encodeJpg(image, quality: 85);
  
  final compressedFile = File('${file.path}_compressed.jpg');
  compressedFile.writeAsBytesSync(compressed);
  
  return compressedFile;
}
```

## Testing Recommendations

### Test Cases
1. **Single receipt images** with clear text
2. **Multiple receipts** in one image
3. **Poor quality images** (blurry, dark, skewed)
4. **Different languages** (English, Mandarin)
5. **Various file formats** (JPEG, PNG, WebP)
6. **Large file sizes** (test limits)
7. **Network interruptions** during processing

### Sample Test Flow
```dart
void runAPITests() async {
  // Test 1: Get receipt types
  final types = await ReceiptAPI.getReceiptTypes();
  assert(types['success'] == true);
  
  // Test 2: Process sample receipt
  final result = await ReceiptAPI.processReceipt(
    imageFile: sampleReceiptFile,
    receiptType: 'weigh_bridge',
  );
  assert(result['success'] == true);
  assert(result['data'] is List);
  
  print('All tests passed!');
}
```

## Prototype Limitations

⚠️ **Important Notes:**
- **No data persistence** - Results are not saved
- **No user authentication** - Open access
- **Rate limiting** - Shared limits across all users
- **Availability** - May have occasional downtime
- **Processing accuracy** - May vary based on image quality
- **API stability** - Subject to changes during development

## Support & Troubleshooting

### Common Issues
1. **Timeout errors** - Increase timeout duration to 60+ seconds
2. **File upload failures** - Check file format and size
3. **Poor OCR results** - Use better quality images
4. **Rate limit hits** - Implement proper retry logic

### Debugging Tips
- Enable logging for all API calls
- Test with the web interface first
- Use the health check endpoint (`/api/receipts/health`) to verify connectivity
- Check response headers for additional error information

---

## Recent Updates & Changelog

### 2025-07-02 - Base64 Image Upload Support
- **New Feature:** Added support for base64 image uploads alongside existing multipart file uploads
- **Enhanced:** Mobile developers can now choose between two upload methods:
  - **Method 1:** Multipart file upload (existing method)
  - **Method 2:** Base64 JSON upload (new method, recommended for mobile)
- **Improved:** Better compatibility with mobile apps that have issues with multipart uploads
- **Updated:** Flutter integration examples now include both methods with automatic fallback
- **Technical Details:**
  - Base64 images sent as `imageBase64` field in JSON request body
  - Supports both data URL format (`data:image/png;base64,...`) and plain base64
  - Same validation and processing pipeline for both methods
  - Same response format regardless of upload method

### 2025-06-30 - Mobile App Fix
- **Fixed:** HTTP 500 errors when mobile apps send images that cannot be processed
- **Improved:** Error handling now returns specific 400 errors instead of generic 500 errors
- **Enhanced:** Better error messages for debugging:
  - Invalid/corrupted image files
  - File type validation
  - File size validation
- **Technical:** Reordered middleware to validate files before processing

### Error Handling Improvements
The API now provides much better error feedback for mobile developers:

- **Before:** Generic 500 "Internal Server Error" 
- **After:** Specific 400 errors with clear messages like:
  - `"Invalid or corrupted image file. Please use a valid JPEG, PNG, or WebP image"`
  - `"File size exceeds limit of 10MB"`
  - `"Invalid file type. Only JPEG, PNG, and WebP images are allowed"`

This makes debugging much easier for mobile app integration.

---

**Note:** This is a prototype API for testing purposes. For production use, additional features like authentication, data persistence, and enhanced error handling would be implemented.