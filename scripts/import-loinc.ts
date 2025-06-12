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

  // Save as JSON for quick loading
  const jsonPath = path.join(process.cwd(), 'data', 'loinc-codes.json')
  fs.writeFileSync(jsonPath, JSON.stringify(loincCodes, null, 2))
  console.log(`Saved ${loincCodes.length} codes to ${jsonPath}`)

  // Generate embeddings in batches
  console.log('Generating embeddings...')
  const batchSize = 100
  const embeddings: any[] = []
  
  for (let i = 0; i < loincCodes.length; i += batchSize) {
    const batch = loincCodes.slice(i, i + batchSize)
    const texts = batch.map(code => 
      `${code.displayName} ${code.longCommonName} ${code.component} ${code.system}`.toLowerCase()
    )
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      })
      
      batch.forEach((code, idx) => {
        embeddings.push({
          code: code.code,
          embedding: response.data[idx].embedding,
        })
      })
      
      console.log(`Processed ${i + batch.length}/${loincCodes.length} codes`)
      
      // Save progress periodically
      if ((i + batchSize) % 1000 === 0) {
        const embeddingsPath = path.join(process.cwd(), 'data', 'loinc-embeddings.json')
        fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2))
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error processing batch at ${i}:`, error)
    }
  }
  
  // Save final embeddings
  const embeddingsPath = path.join(process.cwd(), 'data', 'loinc-embeddings.json')
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2))
  console.log(`Saved embeddings to ${embeddingsPath}`)
  
  console.log('Import complete!')
}

// Run the import
importLoincData().catch(console.error)