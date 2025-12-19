import { Metadata } from 'next'
import { FlightPlannerView } from '@/components/planner/FlightPlannerView'

export const metadata: Metadata = {
  title: 'Planificator Zboruri Inteligent - Flexibilitate Maximă | Program Zboruri',
  description: 'Planificator avansat de zboruri cu flexibilitate ±1, 2 sau 3 zile separat pentru plecare și întoarcere. Găsește zborurile perfecte din Chișinău, București și toate aeroporturile din România și Moldova.',
  keywords: [
    'planificator zboruri',
    'planificare călătorie',
    'zboruri România',
    'zboruri Moldova',
    'zboruri Chișinău',
    'căutare zboruri flexibile',
    'program zboruri săptămânal',
    'rezervare bilete avion',
    'destinații zboruri',
    'orare zboruri',
    'companii aeriene România',
    'flexibilitate zboruri',
    'căutare avansată zboruri'
  ],
  openGraph: {
    title: 'Planificator Zboruri Inteligent - Flexibilitate Maximă',
    description: 'Găsește zborurile perfecte cu flexibilitate ±1, 2 sau 3 zile separat pentru plecare și întoarcere. Material Design M3.',
    type: 'website',
    locale: 'ro_RO',
  },
  alternates: {
    canonical: 'https://anyway.ro/planificator-zboruri'
  }
}

export default function FlightPlannerPage() {
  return <FlightPlannerView />
}