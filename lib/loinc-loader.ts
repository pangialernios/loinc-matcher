import fs from 'fs'
import path from 'path'
import { LoincCode } from './types'

let loincCodes: LoincCode[] | null = null
let loincEmbeddings: Map<string, number[]> | null = null

export async function loadLoincData(): Promise<LoincCode[]> {
  if (loincCodes) return loincCodes

  try {
    // Try to load from JSON file first
    const jsonPath = path.join(process.cwd(), 'data', 'loinc-codes.json')
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf-8')
      loincCodes = JSON.parse(data)
      console.log(`Loaded ${loincCodes.length} LOINC codes from file`)
      return loincCodes
    }
  } catch (error) {
    console.error('Error loading LOINC data:', error)
  }

  // Fall back to sample data
  const { sampleLoincCodes } = await import('./loinc-data')
  loincCodes = sampleLoincCodes
  console.log('Using sample LOINC data')
  return loincCodes
}

export async function loadLoincEmbeddings(): Promise<Map<string, number[]>> {
  if (loincEmbeddings) return loincEmbeddings

  loincEmbeddings = new Map()

  try {
    // Try to load embeddings from file
    const embeddingsPath = path.join(process.cwd(), 'data', 'loinc-embeddings.json')
    if (fs.existsSync(embeddingsPath)) {
      const data = fs.readFileSync(embeddingsPath, 'utf-8')
      const embeddings = JSON.parse(data) as Array<{ code: string; embedding: number[] }>
      
      embeddings.forEach(item => {
        loincEmbeddings!.set(item.code, item.embedding)
      })
      
      console.log(`Loaded ${loincEmbeddings.size} embeddings from file`)
      return loincEmbeddings
    }
  } catch (error) {
    console.error('Error loading embeddings:', error)
  }

  console.log('No pre-computed embeddings found')
  return loincEmbeddings
}