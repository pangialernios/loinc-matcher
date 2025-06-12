'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoincCode } from '@/lib/types'

interface SearchResult {
  code: LoincCode
  confidence: number
  reasoning: string
}

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Enter a search query to find matching LOINC codes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card key={result.code.code} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {result.code.code} - {result.code.shortName}
              </span>
              <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {Math.round(result.confidence * 100)}% match
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              {result.code.longCommonName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Component</p>
                <p className="text-sm text-gray-600">{result.code.component}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">System</p>
                <p className="text-sm text-gray-600">{result.code.system}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Property</p>
                <p className="text-sm text-gray-600">{result.code.property}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Scale</p>
                <p className="text-sm text-gray-600">{result.code.scaleType}</p>
              </div>
            </div>
            {result.reasoning && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-1">Why this matches:</p>
                <p className="text-sm text-gray-600">{result.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}