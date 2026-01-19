import { Metadata } from 'next'
import { Mail, MapPin, Clock, Plane } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact | Anyway.ro - Zboruri din România și Moldova',
  description: 'Contactează-ne pentru întrebări despre zboruri, program aeroporturi sau sugestii.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Plane className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact</h1>
          <p className="text-gray-600">Suntem aici să te ajutăm cu informații despre zboruri</p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Email</h2>
                <a 
                  href="mailto:contact@anyway.ro" 
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  contact@anyway.ro
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Răspundem în maxim 24 de ore
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Locație</h2>
                <p className="text-gray-600">București, România</p>
                <p className="text-sm text-gray-500 mt-2">
                  Serviciu online pentru toată România și Moldova
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Despre Anyway.ro</h2>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>
              Anyway.ro este o platformă dedicată călătorilor din România și Moldova, 
              oferind informații actualizate despre zboruri, program aeroporturi și 
              destinații disponibile.
            </p>
            <p>
              Serviciile noastre includ:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Program zboruri în timp real pentru aeroporturile din România și Moldova</li>
              <li>Căutare destinații cu zboruri directe (Fly Finder)</li>
              <li>Statistici și analize pentru aeroporturi</li>
              <li>Informații despre parcări la aeroporturi</li>
            </ul>
            <p className="text-sm text-gray-500 mt-6">
              Pentru întrebări, sugestii sau colaborări, nu ezita să ne contactezi 
              prin email. Îți mulțumim că folosești Anyway.ro!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
