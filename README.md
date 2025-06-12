# LOINC Matcher

A modern web application that uses AI-powered Retrieval-Augmented Generation (RAG) to match natural language queries with LOINC (Logical Observation Identifiers Names and Codes) codes.

## Features

- **Natural Language Search**: Enter medical terminology in plain English
- **AI-Powered Matching**: Uses OpenAI embeddings for semantic similarity search
- **Confidence Scoring**: Shows match confidence percentages
- **Detailed Explanations**: AI-generated reasoning for each match
- **Clean Modern UI**: Built with Next.js 14 and Tailwind CSS
- **Real-time Results**: Instant search with loading states

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI**: OpenAI API (embeddings + GPT-4o/GPT-3.5-turbo)
- **Vector Search**: In-memory cosine similarity (extensible to Pinecone)

### Note on Vector Storage

The current implementation uses **in-memory vector storage** which is sufficient for:
- Development and testing
- Small to medium datasets (thousands of LOINC codes)
- Quick prototyping

For production use with the full LOINC database (90,000+ codes), consider integrating a vector database like Pinecone for:
- Persistent storage
- Faster similarity search
- Better scalability

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd loinc-matcher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter medical terminology in the search box (e.g., "blood glucose level", "cholesterol test")
2. Press Enter or click Search
3. View matching LOINC codes with confidence scores
4. Read AI-generated explanations for why each code matches

## Example Searches

- "blood sugar test" → Glucose [Mass/volume] in Blood
- "cholesterol level" → Cholesterol [Mass/volume] in Serum or Plasma  
- "red blood cell count" → Erythrocytes [#/volume] in Blood
- "thyroid function" → Thyroid stimulating hormone

## Architecture

The application uses a RAG (Retrieval-Augmented Generation) approach:

1. **Embedding Generation**: LOINC codes are converted to vector embeddings using OpenAI's text-embedding-3-small model
2. **Similarity Search**: User queries are embedded and compared using cosine similarity
3. **Result Augmentation**: GPT-3.5-turbo generates explanations for matches
4. **Confidence Scoring**: Similarity scores are converted to confidence percentages

## Data

Currently uses a curated sample of common LOINC codes. To use the full LOINC database:

1. Download LOINC from https://loinc.org/downloads/
2. Place `Loinc.csv` in the `data/` directory
3. Run `npm run import-loinc` to generate embeddings

See [docs/LOINC_SETUP.md](docs/LOINC_SETUP.md) for detailed instructions.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License