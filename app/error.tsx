'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center px-4">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            We encountered an error while loading the flight information. This might be a temporary issue.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold rounded-lg transition-colors space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Error Details (Development)
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}