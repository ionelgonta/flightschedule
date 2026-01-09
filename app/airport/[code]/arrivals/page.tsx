// PAGINĂ COMENTATĂ - FOLOSIM DOAR VERSIUNEA ROMÂNĂ
// Această pagină a fost dezactivată pentru a păstra doar versiunea română (/aeroport/[code]/sosiri)

// Redirect către versiunea română
import { redirect } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'

interface ArrivalsPageProps {
  params: {
    code: string
  }
}

export default function ArrivalsPage({ params }: ArrivalsPageProps) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    redirect('/aeroporturi')
  }
  
  // Redirect către versiunea română
  redirect(`/aeroport/${generateAirportSlug(airport)}/sosiri`)
}