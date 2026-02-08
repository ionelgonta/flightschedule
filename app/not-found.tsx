import Link from 'next/link'
import { Plane, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
              <Plane className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">404 - Pagina nu a fost găsită</h1>
          <p className="text-lg text-white/85 mb-8">Pagina pe care o cauți pare să fi plecat spre altă destinație.</p>
        </div>
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-3 bg-white/25 text-white font-semibold rounded-2xl hover:bg-white/35 border border-white/20 transition-colors space-x-2">
            <Home className="h-5 w-5" />
            <span>Acasă</span>
          </Link>
          <Link href="/aeroporturi" className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 font-semibold rounded-2xl transition-colors space-x-2">
            <Search className="h-5 w-5" />
            <span>Aeroporturi</span>
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/70">Dacă crezi că e o eroare, verifică adresa sau caută aeroportul dorit.</p>
      </div>
    </div>
  )
}