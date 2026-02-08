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
    <div className="min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="glass-card rounded-2xl border border-white/20 p-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-3">
              📅 Program Săptămânal Zboruri
            </h1>
            <p className="text-base text-white/80 mb-4">
              Programul săptămânal de zboruri pentru toate aeroporturile din România și Moldova
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-blue-500/15 p-3 rounded-xl border border-blue-400/30">
                <h3 className="font-semibold text-white mb-1 text-sm">
                  🛫 Toate Aeroporturile
                </h3>
                <p className="text-xs text-white/80">
                  16 aeroporturi din România și Moldova analizate
                </p>
              </div>
              
              <div className="bg-green-500/15 p-3 rounded-xl border border-green-400/30">
                <h3 className="font-semibold text-white mb-1 text-sm">
                  📊 Date Istorice
                </h3>
                <p className="text-xs text-white/80">
                  Analiză bazată pe ultimele 3 luni de date
                </p>
              </div>
              
              <div className="bg-purple-500/15 p-3 rounded-xl border border-purple-400/30">
                <h3 className="font-semibold text-white mb-1 text-sm">
                  🔄 Actualizare Automată
                </h3>
                <p className="text-xs text-white/80">
                  Program săptămânal pentru toate aeroporturile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Component */}
        <WeeklyScheduleViewSSRFixed />

        {/* Information Section */}
        <div className="mt-6 glass-card rounded-2xl border border-white/20 p-4">
          <h2 className="text-lg font-semibold text-white mb-3">
            Cum funcționează programul săptămânal?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-white mb-2 text-sm">
                📈 Sursa Datelor
              </h3>
              <ul className="space-y-1 text-xs text-white/80">
                <li>• Se analizează zborurile din ultimele 3 luni</li>
                <li>• Datele sunt grupate pe rute (origine → destinație)</li>
                <li>• Programul se generează automat pe baza datelor disponibile</li>
                <li>• Acoperă toate aeroporturile din România și Moldova</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2 text-sm">
                🗓️ Interpretarea Programului
              </h3>
              <ul className="space-y-1 text-xs text-white/80">
                <li>• ● = Zborul operează în acea zi a săptămânii</li>
                <li>• ○ = Zborul nu operează în acea zi</li>
                <li>• Frecvența indică numărul total de zboruri înregistrate</li>
                <li>• Programul se bazează pe datele istorice disponibile</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-500/15 rounded-xl border border-amber-400/30">
            <p className="text-xs text-amber-200">
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