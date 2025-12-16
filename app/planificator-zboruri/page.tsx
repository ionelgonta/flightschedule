import { Metadata } from 'next'
import { FlightPlannerView } from '@/components/planner/FlightPlannerView'

export const metadata: Metadata = {
  title: 'Planificator Zboruri - Găsește Zborurile Perfecte | Program Zboruri',
  description: 'Planifică călătoriile tale cu ușurință! Găsește zborurile perfecte pe baza preferințelor tale de zi și oră. Compară toate destinațiile disponibile din România și Moldova.',
  keywords: [
    'planificator zboruri',
    'planificare călătorie',
    'zboruri România',
    'zboruri Moldova',
    'căutare zboruri',
    'program zboruri',
    'rezervare bilete avion',
    'destinații zboruri',
    'orare zboruri',
    'companii aeriene România'
  ],
  openGraph: {
    title: 'Planificator Zboruri - Găsește Zborurile Perfecte',
    description: 'Planifică călătoriile tale cu ușurință! Găsește zborurile perfecte pe baza preferințelor tale de zi și oră.',
    type: 'website',
    locale: 'ro_RO',
  },
  alternates: {
    canonical: 'https://anyway.ro/planificator-zboruri'
  }
}

export default function FlightPlannerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ✈️ Planificator Zboruri
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Găsește zborurile perfecte pe baza preferințelor tale de zi și oră. 
              Compară toate destinațiile disponibile din România și Moldova.
            </p>
          </div>

          {/* Flight Planner Component */}
          <FlightPlannerView />

          {/* SEO Content */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Cum funcționează Planificatorul de Zboruri?
              </h2>
              
              <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🎯 Pentru cine este util?
                  </h3>
                  <p>
                    Planificatorul nostru este perfect pentru călătorii care au flexibilitate în programul lor și vor să găsească 
                    cele mai bune opțiuni de zbor. Ideal pentru vacanțe, călătorii de afaceri cu program flexibil, sau când vrei 
                    să explorezi destinații noi.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ⚙️ Cum funcționează?
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Selectează zilele preferate:</strong> Alege ziua preferată de plecare și întoarcere, plus flexibilitatea de ±1 zi</li>
                    <li><strong>Alege intervalele orare:</strong> Specifică dacă preferi să pleci/să te întorci dimineața, la amiază sau seara</li>
                    <li><strong>Explorează opțiunile:</strong> Vezi toate destinațiile disponibile care se potrivesc cu preferințele tale</li>
                    <li><strong>Compară și decide:</strong> Analizează orele exacte, aeroporturile și companiile aeriene</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    📊 Date în timp real
                  </h3>
                  <p>
                    Toate informațiile sunt bazate pe datele reale din cache-ul nostru, actualizate constant din sistemele 
                    aeroporturilor. Nu facem apeluri externe în timp real, ci folosim baza noastră de date locală pentru 
                    performanță maximă și rezultate instant.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🌍 Acoperire completă
                  </h3>
                  <p>
                    Monitorizăm toate cele 16 aeroporturi majore din România și Moldova, oferind o imagine completă 
                    a opțiunilor de zbor disponibile. De la București la Cluj, de la Timișoara la Chișinău.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  💡 Exemple de utilizare
                </h3>
                <div className="space-y-3 text-blue-800 dark:text-blue-200">
                  <p><strong>Weekend în Europa:</strong> "Vreau să plec vineri seara și să mă întorc duminică seara"</p>
                  <p><strong>Vacanță flexibilă:</strong> "Pot să plec marți sau miercuri dimineața, să mă întorc după o săptămână"</p>
                  <p><strong>Călătorie de afaceri:</strong> "Trebuie să ajung luni dimineața, să mă întorc joi seara"</p>
                  <p><strong>Explorare destinații:</strong> "Ce opțiuni am dacă vreau să plec sâmbătă și să mă întorc marți?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}