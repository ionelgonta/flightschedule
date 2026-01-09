import { Metadata } from 'next'
import WeeklyScheduleViewSSRFixed from '@/components/analytics/WeeklyScheduleViewSSRFixed'

// Force dynamic rendering to ensure server-side data fetching works
export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              📅 Program Săptămânal Zboruri
            </h1>
            <p className="text-base text-gray-600 mb-4">
              Programul săptămânal de zboruri pentru toate aeroporturile din România și Moldova
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-1 text-sm">
                  🛫 Toate Aeroporturile
                </h3>
                <p className="text-xs text-blue-700">
                  16 aeroporturi din România și Moldova analizate
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-1 text-sm">
                  📊 Date Istorice
                </h3>
                <p className="text-xs text-green-700">
                  Analiză bazată pe ultimele 3 luni de date
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-1 text-sm">
                  🔄 Actualizare Automată
                </h3>
                <p className="text-xs text-purple-700">
                  Program săptămânal pentru toate aeroporturile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Component */}
        <WeeklyScheduleViewSSRFixed />

        {/* Information Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Cum funcționează programul săptămânal?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2 text-sm">
                📈 Sursa Datelor
              </h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Se analizează zborurile din ultimele 3 luni</li>
                <li>• Datele sunt grupate pe rute (origine → destinație)</li>
                <li>• Programul se generează automat pe baza datelor disponibile</li>
                <li>• Acoperă toate aeroporturile din România și Moldova</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2 text-sm">
                🗓️ Interpretarea Programului
              </h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• ● = Zborul operează în acea zi a săptămânii</li>
                <li>• ○ = Zborul nu operează în acea zi</li>
                <li>• Frecvența indică numărul total de zboruri înregistrate</li>
                <li>• Programul se bazează pe datele istorice disponibile</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
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