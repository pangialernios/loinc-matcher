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
      console.log(`Loaded ${loincCodes!.length} LOINC codes from file`)
      return loincCodes!
    }
  } catch (error) {
    console.error('Error loading LOINC data:', error)
  }

  // Fall back to sample data
  const { sampleLoincCodes } = await import('./loinc-data')
  loincCodes = sampleLoincCodes
  console.log('Using sample LOINC data')
  return loincCodes!
}

export async function loadLoincEmbeddings(): Promise<Map<string, number[]>> {
  if (loincEmbeddings) return loincEmbeddings

  loincEmbeddings = new Map()

  try {
    // Try to load embeddings from file
    const embeddingsPath = path.join(process.cwd(), 'data', 'loinc-embeddings.json')
    if (fs.existsSync(embeddingsPath)) {
      // Use streaming approach for large files
      const stats = fs.statSync(embeddingsPath)
      const fileSizeInMB = stats.size / (1024 * 1024)
      
      console.log(`Loading embeddings file (${fileSizeInMB.toFixed(2)} MB)...`)
      
      if (fileSizeInMB > 100) {
        // For very large files, use streaming JSON parser
        await loadEmbeddingsStreaming(embeddingsPath)
      } else {
        // For smaller files, use regular approach but with proper memory handling
        const data = fs.readFileSync(embeddingsPath, 'utf-8')
        const embeddings = JSON.parse(data) as Array<{ code: string; embedding: number[] }>
        
        embeddings.forEach(item => {
          loincEmbeddings!.set(item.code, item.embedding)
        })
      }
      
      console.log(`Loaded ${loincEmbeddings.size} embeddings from file`)
      return loincEmbeddings
    }
  } catch (error) {
    console.error('Error loading embeddings:', error)
  }

  console.log('No pre-computed embeddings found')
  return loincEmbeddings
}

async function loadEmbeddingsStreaming(filePath: string): Promise<void> {
  const BATCH_SIZE = 10000
  const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks
  
  const fd = fs.openSync(filePath, 'r')
  
  try {
    let position = 0
    let totalLoaded = 0
    let buffer = ''
    let foundStart = false
    
    while (true) {
      // Read chunk
      const chunk = Buffer.alloc(CHUNK_SIZE)
      const bytesRead = fs.readSync(fd, chunk, 0, CHUNK_SIZE, position)
      
      if (bytesRead === 0) break
      
      buffer += chunk.subarray(0, bytesRead).toString()
      position += bytesRead
      
      // Find array start if not found yet
      if (!foundStart) {
        const arrayStart = buffer.indexOf('[')
        if (arrayStart === -1) continue
        buffer = buffer.slice(arrayStart + 1)
        foundStart = true
      }
      
      // Process complete objects in buffer
      const batch: Array<{ code: string; embedding: number[] }> = []
      
      while (true) {
        // Find next complete object
        const objectStart = buffer.indexOf('{')
        if (objectStart === -1) break
        
        let braceCount = 0
        let inString = false
        let escapeNext = false
        let objectEnd = -1
        
        for (let i = objectStart; i < buffer.length; i++) {
          const char = buffer[i]
          
          if (escapeNext) {
            escapeNext = false
            continue
          }
          
          if (char === '\\' && inString) {
            escapeNext = true
            continue
          }
          
          if (char === '"') {
            inString = !inString
            continue
          }
          
          if (inString) continue
          
          if (char === '{') {
            braceCount++
          } else if (char === '}') {
            braceCount--
            if (braceCount === 0) {
              objectEnd = i
              break
            }
          }
        }
        
        if (objectEnd === -1) break // Incomplete object, wait for more data
        
        // Parse the complete object
        const objectStr = buffer.slice(objectStart, objectEnd + 1)
        buffer = buffer.slice(objectEnd + 1)
        
        try {
          const item = JSON.parse(objectStr) as { code: string; embedding: number[] }
          batch.push(item)
          
          if (batch.length >= BATCH_SIZE) {
            // Process batch
            batch.forEach(obj => {
              loincEmbeddings!.set(obj.code, obj.embedding)
            })
            totalLoaded += batch.length
            console.log(`Loaded ${totalLoaded} embeddings...`)
            batch.length = 0
          }
        } catch (e) {
          // Skip malformed objects
        }
        
        // Check for end of array
        const nextChar = buffer.trim()[0]
        if (nextChar === ']') {
          // Process remaining batch
          if (batch.length > 0) {
            batch.forEach(obj => {
              loincEmbeddings!.set(obj.code, obj.embedding)
            })
            totalLoaded += batch.length
          }
          console.log(`Finished loading ${totalLoaded} embeddings`)
          return
        }
      }
      
      // Process any remaining batch items
      if (batch.length > 0) {
        batch.forEach(obj => {
          loincEmbeddings!.set(obj.code, obj.embedding)
        })
        totalLoaded += batch.length
        console.log(`Loaded ${totalLoaded} embeddings...`)
      }
      
      // Keep some buffer for incomplete objects
      if (buffer.length > CHUNK_SIZE) {
        // Find last complete object boundary
        const lastBrace = buffer.lastIndexOf('}')
        if (lastBrace > 0) {
          buffer = buffer.slice(lastBrace + 1)
        }
      }
    }
    
    console.log(`Finished loading ${totalLoaded} embeddings`)
  } finally {
    fs.closeSync(fd)
  }
}