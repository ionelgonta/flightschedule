import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parcări Aeroport București Otopeni Henri Coandă | Rezervare Online',
  description: 'Găsește cea mai bună parcare pentru Aeroportul București Otopeni. Compară parcări oficiale și private cu transfer la terminal. Rezervare online rapidă și sigură.',
  keywords: 'parcare aeroport otopeni, parcare bucuresti aeroport, henri coanda parking, parcare oficiala otopeni, parcare privata aeroport, rezervare parcare online',
  openGraph: {
    title: 'Parcări Aeroport București Otopeni Henri Coandă',
    description: 'Compară și rezervă parcări oficiale și private pentru Aeroportul București Otopeni. Transfer gratuit la terminal.',
    type: 'website',
    locale: 'ro_RO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parcări Aeroport București Otopeni Henri Coandă',
    description: 'Găsește cea mai bună parcare pentru Aeroportul București Otopeni. Rezervare online rapidă.',
  },
  alternates: {
    canonical: '/parcari-otopeni'
  }
}

export default function ParcariOtopeniLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}