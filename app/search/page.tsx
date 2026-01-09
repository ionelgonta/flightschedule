// PAGINĂ COMENTATĂ - FOLOSIM DOAR VERSIUNEA ROMÂNĂ
// Această pagină a fost dezactivată pentru a păstra doar versiunea română (/cautare)

// Redirect către versiunea română
import { redirect } from 'next/navigation'

export default function SearchPage() {
  // Redirect către versiunea română
  redirect('/cautare')
}