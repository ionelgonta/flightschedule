import { Metadata } from 'next'
import WeeklyScheduleView from '@/components/analytics/WeeklyScheduleView'

export const metadata: Metadata = {
  title: 'Program Săptămânal Zboruri | Anyway.ro',
  description: 'Programul săptămânal de zboruri pentru toate aeroporturile din România și Moldova. Analiză bazată pe datele istorice din ultimele 3 luni.',
  keywords: 'program zboruri, program săptămânal, zboruri România, zboruri Moldova, program aeroporturi',
  openGraph: {
    title: 'Program Săptămânal Zboruri | Anyway.ro',
    description: 'Programul săptămânal de zboruri pentru toate aeroporturile din România și Moldova.',
    type: 'website',
  }
}

export default function WeeklySchedulePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              📅 Program Săptămânal Zboruri
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Programul săptămânal de zboruri pentru toate aeroporturile din România și Moldova
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🛫 Toate Aeroporturile
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  16 aeroporturi din România și Moldova analizate
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  📊 Date Istorice
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Analiză bazată pe ultimele 3 luni de date
                </p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🔄 Actualizare Automată
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Programul se actualizează automat la fiecare 30 de minute
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Component */}
        <WeeklyScheduleView />

        {/* Information Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Cum funcționează programul săptămânal?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                📈 Sursa Datelor
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Se analizează zborurile din ultimele 3 luni</li>
                <li>• Datele sunt grupate pe rute (origine → destinație)</li>
                <li>• Programul se generează automat pe baza datelor disponibile</li>
                <li>• Acoperă toate aeroporturile din România și Moldova</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                🗓️ Interpretarea Programului
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• ● = Zborul operează în acea zi a săptămânii</li>
                <li>• ○ = Zborul nu operează în acea zi</li>
                <li>• Frecvența indică numărul total de zboruri înregistrate</li>
                <li>• Programul se bazează pe datele istorice disponibile</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Notă:</strong> Programul săptămânal este generat pe baza datelor istorice și poate să nu reflecte 
              modificările recente ale programelor de zbor. Pentru informații actualizate în timp real, 
              consultați paginile de sosiri/plecări ale fiecărui aeroport.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}