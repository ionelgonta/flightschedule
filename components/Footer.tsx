import Link from 'next/link'
import { Plane } from 'lucide-react'
import { AdBanner } from './ads/AdBanner'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/20 mt-8">
      <div className="glass-card mx-4 mb-4 rounded-2xl overflow-hidden">
        <AdBanner slot="footer-banner" size="970x90" className="max-w-container mx-auto" />
      </div>
      
      <div className="max-w-container mx-auto container-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand - weather-app style */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="title-large text-white font-medium">Program Zboruri</span>
            </div>
            <p className="body-large text-white/85 mb-6 max-w-md leading-relaxed">
              Găsirea informațiilor de zbor în timp real este esențială pentru fiecare călător. 
              Platforma noastră oferă actualizări continue despre sosiri și plecări de la aeroporturi majore din întreaga lume.
            </p>
            <p className="body-small text-white/70">
              © 2024 Program Zboruri. Toate drepturile rezervate.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="title-medium text-white mb-6">Linkuri Rapide</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Acasă
                </Link>
              </li>
              <li>
                <Link href="/aeroporturi" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Aeroporturi
                </Link>
              </li>
              <li>
                <Link href="/program-saptamanal" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Program Săptămânal
                </Link>
              </li>
              <li>
                <Link href="/parcari-otopeni" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Parcări Otopeni
                </Link>
              </li>
              <li>
                <Link href="/despre" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Despre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Airports */}
          <div>
            <h3 className="title-medium text-white mb-6">Aeroporturi România</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/airport/bucuresti-henri-coanda" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  București - Henri Coandă
                </Link>
              </li>
              <li>
                <Link href="/airport/cluj-napoca-cluj-napoca" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Cluj-Napoca
                </Link>
              </li>
              <li>
                <Link href="/airport/timisoara-timisoara-traian-vuia" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Timișoara - Traian Vuia
                </Link>
              </li>
              <li>
                <Link href="/airport/chisinau-chisinau" className="body-medium text-white/85 hover:text-white transition-colors block py-1">
                  Chișinău
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="body-medium text-white/75">
            Informațiile despre zboruri sunt furnizate doar în scop informativ. 
            Vă rugăm să verificați cu companiile aeriene pentru cele mai recente informații.
          </p>
        </div>
      </div>
    </footer>
  )
}