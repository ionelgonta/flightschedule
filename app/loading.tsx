import { Plane } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
            <Plane className="h-12 w-12 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Se încarcă informațiile...</h2>
        <p className="text-white/85">Te rugăm să aștepți în timp ce preluăm datele...</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
        </div>
      </div>
    </div>
  )
}