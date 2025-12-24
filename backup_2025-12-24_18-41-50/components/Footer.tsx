import Link from 'next/link'
import { Plane } from 'lucide-react'
import { AdBanner } from './ads/AdBanner'

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant">
      {/* Footer Banner Ad */}
      <div className="border-b border-outline-variant">
        <AdBanner 
          slot="footer-banner"
          size="970x90"
          className="max-w-container mx-auto"
        />
      </div>
      
      <div className="max-w-container mx-auto container-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-primary-40 rounded-2xl">
                <Plane className="h-6 w-6 text-on-primary" />
              </div>
              <span className="title-large text-on-surface font-medium">Program Zboruri</span>
            </div>
            <p className="body-large text-on-surface-variant mb-6 max-w-md leading-relaxed">
              Găsirea informațiilor de zbor în timp real este esențială pentru fiecare călător. 
              Platforma noastră oferă actualizări continue despre sosiri și plecări de la aeroporturi majore din întreaga lume.
            </p>
            <p className="body-small text-on-surface-variant">
              © 2024 Program Zboruri. Toate drepturile rezervate.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="title-medium text-on-surface mb-6">Linkuri Rapide</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Acasă
                </Link>
              </li>
              <li>
                <Link href="/aeroporturi" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Aeroporturi
                </Link>
              </li>
              <li>
                <Link href="/program-saptamanal" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Program Săptămânal
                </Link>
              </li>
              <li>
                <Link href="/parcari-otopeni" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Parcări Otopeni
                </Link>
              </li>
              <li>
                <Link href="/despre" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Despre
                </Link>
              </li>
              <li>
                <Link href="/contact" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Airports */}
          <div>
            <h3 className="title-medium text-on-surface mb-6">Aeroporturi România</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/airport/bucuresti-henri-coanda" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  București - Henri Coandă
                </Link>
              </li>
              <li>
                <Link href="/airport/cluj-napoca-cluj-napoca" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Cluj-Napoca
                </Link>
              </li>
              <li>
                <Link href="/airport/timisoara-timisoara-traian-vuia" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Timișoara - Traian Vuia
                </Link>
              </li>
              <li>
                <Link href="/airport/chisinau-chisinau" className="state-layer body-medium text-on-surface-variant hover:text-primary-40 transition-colors duration-200 block py-1">
                  Chișinău
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-outline-variant mt-12 pt-8 text-center">
          <p className="body-medium text-on-surface-variant">
            Informațiile despre zboruri sunt furnizate doar în scop informativ. 
            Vă rugăm să verificați cu companiile aeriene pentru cele mai recente informații.
          </p>
        </div>
      </div>
    </footer>
  )
}