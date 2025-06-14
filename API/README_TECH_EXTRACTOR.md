# Technology Extractor API

This API extracts technology names from text using the Gemini API or a fallback method.

## Features

- Extract technologies from a single text
- Batch processing for multiple texts
- Fallback extraction when API is unavailable
- Handles compound technology names (e.g., "React JS")

## Setup

1. Install dependencies:
```
pip install fastapi uvicorn python-dotenv sentence-transformers google-generativeai
```

2. Create a `.env` file with your Gemini API key:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Run the API:
```
# Windows
run_tech_extractor.bat

# Linux/Mac
chmod +x run_tech_extractor.sh
./run_tech_extractor.sh
```

## API Endpoints

### Health Check
```
GET /health
```

### Extract Technologies from Text
```
GET /extract?text=Complete React JS Course for Beginners
POST /extract
{
  "text": "Complete React JS Course for Beginners"
}
```

Response:
```json
{
  "technologies": ["react js", "javascript"]
}
```

### Batch Extract Technologies
```
POST /extract/batch
{
  "texts": [
    "Complete React JS Course for Beginners",
    "Python Programming Tutorial for Data Science"
  ]
}
```

Response:
```json
{
  "results": [
    {
      "text": "Complete React JS Course for Beginners",
      "technologies": ["react js", "javascript"]
    },
    {
      "text": "Python Programming Tutorial for Data Science",
      "technologies": ["python", "data science"]
    }
  ]
}
```

## Integration with Technology Matcher

This API works alongside the Technology Matcher API to provide a complete solution for technology name extraction and matching.

- Tech Extractor: Extracts technology names from text
- Tech Matcher: Determines if two technology names are semantically equivalent 