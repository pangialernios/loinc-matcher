import { SearchInterface } from '@/components/SearchInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            LOINC Matcher
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find LOINC codes using natural language. Powered by AI to match your medical terminology with standardized codes.
          </p>
        </div>
        <SearchInterface />
      </div>
    </main>
  )
}