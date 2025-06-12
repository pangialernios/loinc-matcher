import OpenAI from 'openai'
import { LoincCode } from './types'
import { createSearchableText } from './loinc-data'
import { loadLoincData, loadLoincEmbeddings } from './loinc-loader'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface EmbeddedCode {
  code: LoincCode
  embedding: number[]
  searchText: string
}

let embeddedCodes: EmbeddedCode[] = []

export async function initializeEmbeddings(): Promise<void> {
  if (embeddedCodes.length > 0) return

  console.log('Initializing LOINC embeddings...')
  
  // Load LOINC data
  const loincCodes = await loadLoincData()
  const embeddings = await loadLoincEmbeddings()
  
  // If we have pre-computed embeddings, use them
  if (embeddings.size > 0) {
    for (const code of loincCodes) {
      const embedding = embeddings.get(code.code)
      if (embedding) {
        embeddedCodes.push({
          code,
          embedding,
          searchText: createSearchableText(code),
        })
      }
    }
    console.log(`Loaded ${embeddedCodes.length} pre-computed embeddings`)
    return
  }
  
  // Otherwise, generate embeddings on the fly (for sample data)
  for (const code of loincCodes) {
    const searchText = createSearchableText(code)
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: searchText,
      })

      embeddedCodes.push({
        code,
        embedding: response.data[0].embedding,
        searchText,
      })
    } catch (error) {
      console.error(`Failed to embed code ${code.code}:`, error)
    }
  }
  
  console.log(`Initialized ${embeddedCodes.length} LOINC embeddings`)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function searchSimilarCodes(query: string, limit: number = 5): Promise<{ code: LoincCode; similarity: number }[]> {
  if (embeddedCodes.length === 0) {
    await initializeEmbeddings()
  }

  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query.toLowerCase(),
  })

  const queryVector = queryEmbedding.data[0].embedding
  
  const similarities = embeddedCodes.map((embeddedCode) => ({
    code: embeddedCode.code,
    similarity: cosineSimilarity(queryVector, embeddedCode.embedding),
  }))

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}