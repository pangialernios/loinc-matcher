import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model categories and their priorities for sorting
const MODEL_PRIORITIES = {
  'gpt-4o': 1,
  'gpt-4-turbo': 2,
  'gpt-4': 3,
  'gpt-3.5-turbo': 4,
  'gpt-3.5': 5,
}

// Models to exclude (can be updated as models are deprecated)
const EXCLUDED_PATTERNS = [
  'instruct',    // Instruction models
  'vision',      // Vision models
  'realtime',    // Realtime models
  'audio',       // Audio models
  '0125',        // Specific dated versions
  '0613',
  '0301',
  '0314',
  'babbage',     // Legacy models
  'davinci',
  'curie',
  'ada',
]

export async function GET() {
  try {
    const models = await openai.models.list()
    
    // Filter and process models
    const chatModels = models.data
      .filter(model => {
        // Include only GPT models
        if (!model.id.includes('gpt')) return false
        
        // Exclude patterns
        const shouldExclude = EXCLUDED_PATTERNS.some(pattern => 
          model.id.toLowerCase().includes(pattern)
        )
        if (shouldExclude) return false
        
        return true
      })
      .map(model => {
        // Extract base model name for grouping
        const baseModel = Object.keys(MODEL_PRIORITIES).find(base => 
          model.id.startsWith(base)
        ) || model.id
        
        // Determine display name and description
        let displayName = model.id
        let description = ''
        
        if (model.id === 'gpt-4o') {
          displayName = 'GPT-4o'
          description = 'Latest and most capable model'
        } else if (model.id === 'gpt-4o-mini') {
          displayName = 'GPT-4o Mini'
          description = 'Affordable GPT-4 quality'
        } else if (model.id === 'gpt-4-turbo') {
          displayName = 'GPT-4 Turbo'
          description = 'High capability model'
        } else if (model.id === 'gpt-4-turbo-preview') {
          displayName = 'GPT-4 Turbo Preview'
          description = 'Latest GPT-4 preview'
        } else if (model.id === 'gpt-4') {
          displayName = 'GPT-4'
          description = 'Advanced reasoning'
        } else if (model.id === 'gpt-3.5-turbo') {
          displayName = 'GPT-3.5 Turbo'
          description = 'Fast and cost-effective'
        } else {
          // For any other models, clean up the name
          displayName = model.id
            .replace('gpt-', 'GPT-')
            .replace('-turbo', ' Turbo')
            .replace('-preview', ' Preview')
        }
        
        return {
          id: model.id,
          name: displayName,
          description,
          baseModel,
          created: model.created,
        }
      })
      .sort((a, b) => {
        // Sort by priority first
        const aPriority = MODEL_PRIORITIES[a.baseModel] || 999
        const bPriority = MODEL_PRIORITIES[b.baseModel] || 999
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // Then by creation date (newer first)
        return b.created - a.created
      })
    
    // Group models by base type
    const groupedModels = chatModels.reduce((acc, model) => {
      const group = model.baseModel
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(model)
      return acc
    }, {} as Record<string, typeof chatModels>)

    return NextResponse.json({ 
      models: chatModels,
      grouped: groupedModels,
      recommended: chatModels[0]?.id || 'gpt-4o' 
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}