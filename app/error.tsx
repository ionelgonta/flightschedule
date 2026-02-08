'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/20 rounded-2xl border border-red-400/40">
              <AlertTriangle className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ceva nu a mers bine</h1>
          <p className="text-lg text-white/85 mb-8">A apărut o eroare la încărcarea informațiilor. Poate fi temporar.</p>
        </div>
        <div className="space-y-4">
          <button onClick={reset} className="inline-flex items-center justify-center w-full px-6 py-3 bg-white/25 text-white font-semibold rounded-2xl hover:bg-white/35 border border-white/20 transition-colors">
            Încearcă din nou
          </button>
          <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 font-semibold rounded-2xl transition-colors space-x-2">
            <Home className="h-5 w-5" />
            <span>Acasă</span>
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/20 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">Detalii eroare (Development)</h3>
            <pre className="text-xs text-white/80 overflow-auto">{error.message}</pre>
          </div>
        )}
      </div>
    </div>
  )
}