export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton"></div>
        </div>
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton"></div>
      </div>

      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded skeleton"></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                      <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}