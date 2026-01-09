// PAGINĂ COMENTATĂ - FOLOSIM DOAR VERSIUNEA ROMÂNĂ
// Această pagină a fost dezactivată pentru a păstra doar versiunea română (/aeroporturi)

// Redirect către versiunea română
import { redirect } from 'next/navigation'

export default function AirportsPage() {
  // Redirect către versiunea română
  redirect('/aeroporturi')
}