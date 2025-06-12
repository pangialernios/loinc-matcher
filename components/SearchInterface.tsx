'use client'

import { useState, useEffect } from 'react'
import { Search, Settings2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SearchResults } from '@/components/SearchResults'

export function SearchInterface() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Fetch available models on component mount
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        setAvailableModels(data.models || [])
        if (data.recommended) {
          setSelectedModel(data.recommended)
        }
      })
      .catch(console.error)
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, model: selectedModel }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter medical terminology (e.g., 'blood glucose level', 'cholesterol test')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full text-lg"
            />
          </div>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-8"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
        
        {showSettings && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                AI Model:
              </label>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 max-w-xs"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </Select>
              <span className="text-xs text-gray-500">
                {availableModels.find(m => m.id === selectedModel)?.description || ''}
              </span>
            </div>
          </div>
        )}
      </div>

      <SearchResults results={results} isLoading={isLoading} />
    </div>
  )
}