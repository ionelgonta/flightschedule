import { Plane } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Plane className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Loading Flight Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we fetch the latest data...
        </p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    </div>
  )
}