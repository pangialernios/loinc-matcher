# LOINC Dataset Setup Guide

This guide explains how to include the full LOINC dataset in your application.

## Overview

The application can work with:
1. **Sample data** (10 codes) - Built-in for testing
2. **Full LOINC dataset** (90,000+ codes) - Requires download and import

## Getting the LOINC Dataset

1. **Register at LOINC.org**
   - Go to https://loinc.org/downloads/
   - Create a free account
   - Accept the license terms

2. **Download LOINC**
   - Download the "LOINC Table File" (CSV format)
   - Current version: 2.76 (as of 2024)
   - File size: ~50MB compressed

3. **Extract Files**
   - Unzip the downloaded file
   - Find `Loinc.csv` in the extracted folder

## Importing LOINC Data

1. **Prepare the data directory**
   ```bash
   mkdir -p data
   ```

2. **Copy the LOINC CSV**
   ```bash
   cp /path/to/extracted/Loinc.csv data/
   ```

3. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```
   
   Note: If you encounter timeout issues with npm install, you may need to:
   - Use a different network connection
   - Try `npm install csv-parse --save-dev` separately
   - Or use yarn: `yarn add -D csv-parse`

4. **Run the import script**
   ```bash
   npm run import-loinc
   ```
   
   This compiles the TypeScript and runs it without requiring ts-node.
   
   **For WSL/Windows users**: The script uses the TypeScript compiler directly to avoid network issues with npm package installation.

   This will:
   - Parse the CSV file
   - Filter active LOINC codes
   - Generate embeddings using OpenAI
   - Save processed data to JSON files

## Import Process Details

The import script (`scripts/import-loinc.ts`) performs these steps:

1. **Reads** `data/Loinc.csv`
2. **Filters** for active codes only
3. **Converts** to standardized format
4. **Saves** codes to `data/loinc-codes.json`
5. **Generates** embeddings in batches of 100
6. **Saves** embeddings to `data/loinc-embeddings.json`

### Time and Cost Estimates

For the full LOINC dataset (~90,000 codes):
- **Time**: 2-3 hours (with rate limiting)
- **API Cost**: ~$0.50-$1.00 for embeddings
- **Storage**: ~500MB for embeddings JSON

## Performance Considerations

### With Sample Data (10 codes)
- Embeddings generated on startup
- No persistent storage needed
- Instant search

### With Full Dataset (90,000+ codes)
- Pre-computed embeddings loaded from file
- ~500MB memory usage
- Sub-second search times

## Scaling Options

For production deployments with millions of searches:

### Option 1: PostgreSQL with pgvector
```sql
CREATE EXTENSION vector;
CREATE TABLE loinc_codes (
  code VARCHAR(10) PRIMARY KEY,
  embedding vector(1536),
  data JSONB
);
```

### Option 2: Pinecone Integration
```typescript
import { PineconeClient } from '@pinecone-database/pinecone';

const pinecone = new PineconeClient();
await pinecone.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});
```

### Option 3: Qdrant or Weaviate
- Self-hosted vector database options
- Better for on-premise deployments

## Troubleshooting

### "LOINC CSV file not found"
- Ensure `Loinc.csv` is in the `data/` directory
- Check file permissions

### "Rate limit exceeded"
- The script includes 100ms delays between batches
- Increase delay if needed

### "Out of memory"
- Process in smaller batches
- Use a vector database instead of JSON files

## Data Updates

LOINC releases updates twice yearly:
- Check https://loinc.org for new versions
- Re-run import process for updates
- Consider differential updates for production