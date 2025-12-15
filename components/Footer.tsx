import Link from 'next/link'
import { Plane } from 'lucide-react'
import { AdBanner } from './ads/AdBanner'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Footer Banner Ad */}
      <div className="border-b border-gray-800">
        <AdBanner 
          slot="footer-banner"
          size="970x90"
          className="max-w-7xl mx-auto"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Program Zboruri</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Găsirea informațiilor de zbor în timp real este esențială pentru fiecare călător. 
              Platforma noastră oferă actualizări continue despre sosiri și plecări de la aeroporturi majore din întreaga lume.
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Program Zboruri. Toate drepturile rezervate.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Linkuri Rapide</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Acasă
                </Link>
              </li>
              <li>
                <Link href="/airports" className="text-gray-400 hover:text-white transition-colors">
                  Aeroporturi
                </Link>
              </li>
              <li>
                <Link href="/despre" className="text-gray-400 hover:text-white transition-colors">
                  Despre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Airports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Aeroporturi România</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/airport/bucuresti-henri-coanda" className="text-gray-400 hover:text-white transition-colors">
                  București - Henri Coandă
                </Link>
              </li>
              <li>
                <Link href="/airport/cluj-napoca-cluj-napoca" className="text-gray-400 hover:text-white transition-colors">
                  Cluj-Napoca
                </Link>
              </li>
              <li>
                <Link href="/airport/timisoara-timisoara-traian-vuia" className="text-gray-400 hover:text-white transition-colors">
                  Timișoara - Traian Vuia
                </Link>
              </li>
              <li>
                <Link href="/airport/chisinau-chisinau" className="text-gray-400 hover:text-white transition-colors">
                  Chișinău
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-sm">
            Informațiile despre zboruri sunt furnizate doar în scop informativ. 
            Vă rugăm să verificați cu companiile aeriene pentru cele mai recente informații.
          </p>
        </div>
      </div>
    </footer>
  )
}