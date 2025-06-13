import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import OpenAI from 'openai'
import { LoincCode } from '../lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface LoincRow {
  LOINC_NUM: string
  COMPONENT: string
  PROPERTY: string
  TIME_ASPCT: string
  SYSTEM: string
  SCALE_TYP: string
  METHOD_TYP: string
  CLASS: string
  VersionLastChanged: string
  SHORTNAME: string
  LONG_COMMON_NAME: string
  DisplayName: string
  CLASSTYPE: string
  STATUS: string
}

interface ProgressState {
  processedCount: number
  lastProcessedCode?: string
}

function loadProgress(): ProgressState {
  const progressPath = path.join(process.cwd(), 'data', 'import-progress.json')
  if (fs.existsSync(progressPath)) {
    try {
      return JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
    } catch (error) {
      console.log('Could not read progress file, starting fresh...')
    }
  }
  return { processedCount: 0 }
}

function saveProgress(state: ProgressState) {
  const progressPath = path.join(process.cwd(), 'data', 'import-progress.json')
  fs.writeFileSync(progressPath, JSON.stringify(state, null, 2))
}

async function importLoincData() {
  console.log('Starting LOINC data import...')
  
  // Path to your LOINC CSV file
  const csvPath = path.join(process.cwd(), 'data', 'Loinc.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(`
LOINC CSV file not found at: ${csvPath}

To import LOINC data:
1. Download LOINC from https://loinc.org/downloads/
2. Extract the ZIP file
3. Copy 'Loinc.csv' to the 'data' directory
4. Run this script again
    `)
    return
  }

  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as LoincRow[]

  console.log(`Found ${records.length} LOINC codes`)

  // Filter active codes only
  const activeCodes = records.filter(row => row.STATUS === 'ACTIVE')
  console.log(`${activeCodes.length} active codes to process`)

  // Convert to our format
  const loincCodes: LoincCode[] = activeCodes.map(row => ({
    code: row.LOINC_NUM,
    displayName: row.DisplayName || row.LONG_COMMON_NAME,
    longCommonName: row.LONG_COMMON_NAME,
    shortName: row.SHORTNAME,
    component: row.COMPONENT,
    property: row.PROPERTY,
    timeAspect: row.TIME_ASPCT,
    system: row.SYSTEM,
    scaleType: row.SCALE_TYP,
    methodType: row.METHOD_TYP,
    className: row.CLASS,
    versionLastChanged: row.VersionLastChanged,
  }))

  // Save LOINC codes as JSON (streaming approach)
  const jsonPath = path.join(process.cwd(), 'data', 'loinc-codes.json')
  const jsonStream = fs.createWriteStream(jsonPath)
  jsonStream.write('[\n')
  
  for (let i = 0; i < loincCodes.length; i++) {
    const code = loincCodes[i]
    const json = JSON.stringify(code, null, 2)
    if (i > 0) jsonStream.write(',\n')
    jsonStream.write(json)
  }
  
  jsonStream.write('\n]')
  jsonStream.end()
  console.log(`Saved ${loincCodes.length} codes to ${jsonPath}`)

  // Generate embeddings with streaming output
  console.log('Generating embeddings...')
  const batchSize = 100
  const embeddingsPath = path.join(process.cwd(), 'data', 'loinc-embeddings.json')
  const tempPath = path.join(process.cwd(), 'data', 'loinc-embeddings.tmp.json')
  
  // Load progress
  const progress = loadProgress()
  let startIndex = 0
  
  // If we have a last processed code, find where to resume
  if (progress.lastProcessedCode) {
    const resumeIndex = loincCodes.findIndex(code => code.code === progress.lastProcessedCode)
    if (resumeIndex >= 0) {
      startIndex = resumeIndex + 1
      console.log(`Resuming from code ${progress.lastProcessedCode} (index ${startIndex})...`)
    }
  }
  
  // Open file stream for embeddings
  const embeddingStream = fs.createWriteStream(tempPath, { flags: 'a' })
  
  // If starting fresh, write opening bracket
  if (startIndex === 0) {
    embeddingStream.write('[\n')
  }
  
  let processedCount = progress.processedCount
  
  for (let i = startIndex; i < loincCodes.length; i += batchSize) {
    const batch = loincCodes.slice(i, Math.min(i + batchSize, loincCodes.length))
    const texts = batch.map(code => 
      [
        code.displayName,
        code.longCommonName,
        code.shortName,
        code.component,
        code.system,
        code.property,
        code.className
      ].join(' ').toLowerCase()
    )
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      })
      
      // Write embeddings directly to file
      for (let j = 0; j < batch.length; j++) {
        const embedding = {
          code: batch[j].code,
          embedding: response.data[j].embedding,
        }
        
        if (processedCount > 0) {
          embeddingStream.write(',\n')
        }
        
        embeddingStream.write(JSON.stringify(embedding))
        processedCount++
      }
      
      console.log(`Processed ${Math.min(i + batchSize, loincCodes.length)}/${loincCodes.length} codes`)
      
      // Save progress
      saveProgress({
        processedCount,
        lastProcessedCode: batch[batch.length - 1].code
      })
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error processing batch at ${i}:`, error)
      embeddingStream.end()
      throw error
    }
  }
  
  // Close the JSON array
  embeddingStream.write('\n]')
  embeddingStream.end()
  
  // Wait for stream to finish
  await new Promise<void>((resolve) => embeddingStream.on('finish', () => resolve()))
  
  // Rename temp file to final file
  if (fs.existsSync(embeddingsPath)) {
    fs.unlinkSync(embeddingsPath)
  }
  fs.renameSync(tempPath, embeddingsPath)
  
  console.log(`Saved ${processedCount} embeddings to ${embeddingsPath}`)
  
  // Clean up progress file
  const progressPath = path.join(process.cwd(), 'data', 'import-progress.json')
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath)
  }
  
  console.log('Import complete!')
}

// Run the import
importLoincData().catch(console.error)