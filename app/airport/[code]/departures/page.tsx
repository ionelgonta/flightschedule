// PAGINĂ COMENTATĂ - FOLOSIM DOAR VERSIUNEA ROMÂNĂ
// Această pagină a fost dezactivată pentru a păstra doar versiunea română (/aeroport/[code]/plecari)

// Redirect către versiunea română
import { redirect } from 'next/navigation'
import { getAirportByCodeOrSlug, generateAirportSlug } from '@/lib/airports'

interface DeparturesPageProps {
  params: {
    code: string
  }
}

export default function DeparturesPage({ params }: DeparturesPageProps) {
  const airport = getAirportByCodeOrSlug(params.code)
  
  if (!airport) {
    redirect('/aeroporturi')
  }
  
  // Redirect către versiunea română
  redirect(`/aeroport/${generateAirportSlug(airport)}/plecari`)
}