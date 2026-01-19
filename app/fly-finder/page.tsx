import { Metadata } from 'next'
import FlyFinderView from '@/components/fly-finder/FlyFinderView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FlyFinder | Colibri24.com - Asistent Inteligent de Călătorie',
  description: 'Găsește zborurile perfecte cu FlyFinder - asistentul inteligent de călătorie. Vizualizează calendarul zborurilor, alege destinația și vezi opțiunile disponibile instant.',
  keywords: [
    'fly finder',
    'căutare zboruri',
    'planificator călătorie',
    'program zboruri',
    'zboruri România',
    'zboruri Moldova',
    'calendar zboruri',
    'destinații aeriene',
    'asistent călătorie'
  ],
  openGraph: {
    title: 'FlyFinder | Colibri24.com - Asistent Inteligent de Călătorie',
    description: 'Găsește zborurile perfecte cu FlyFinder. Calendar interactiv, destinații disponibile și detalii complete.',
    type: 'website',
    locale: 'ro_RO',
  },
  alternates: {
    canonical: 'https://anyway.ro/fly-finder'
  }
}

export default function FlyFinderPage() {
  return <FlyFinderView />
}
