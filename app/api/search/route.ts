import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchSimilarCodes } from '@/lib/embeddings'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { query, model = 'gpt-4o' } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    const similarCodes = await searchSimilarCodes(query, 5)

    const results = await Promise.all(
      similarCodes.map(async ({ code, similarity }) => {
        try {
          const completion = await openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are a medical terminology expert. Explain why a LOINC code matches a user's query. Be concise and focus on the medical relevance. Keep explanations under 100 words.`
              },
              {
                role: 'user',
                content: `Query: "${query}"
LOINC Code: ${code.code}
Display Name: ${code.displayName}
Component: ${code.component}
System: ${code.system}
Property: ${code.property}

Explain why this LOINC code matches the query:`
              }
            ],
            max_tokens: 150,
            temperature: 0.3,
          })

          return {
            code,
            confidence: similarity,
            reasoning: completion.choices[0]?.message?.content || 'No explanation available',
          }
        } catch (error) {
          console.error('Error generating reasoning:', error)
          return {
            code,
            confidence: similarity,
            reasoning: 'This code matches based on semantic similarity to your query.',
          }
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}