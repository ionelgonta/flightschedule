import { Calendar } from 'lucide-react'

export default function WeeklyScheduleViewBasic() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Program Săptămânal Zboruri (Basic Version)
            </h3>
            <p className="text-sm text-gray-600">
              Versiune de bază pentru testare
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            Status: Componenta funcționează!
          </h4>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800">
              ✅ Componenta se încarcă corect pe server
            </p>
            <p className="text-green-700 text-sm mt-2">
              Aceasta este o versiune de bază pentru a testa dacă componentele React funcționează.
              Următorul pas va fi să adăugăm funcționalitatea completă.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Următorii pași:</h5>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>1. ✅ Verificare că componenta se încarcă</li>
              <li>2. 🔄 Adăugare date din API</li>
              <li>3. 🔄 Implementare dual-view (Destinații/Zile)</li>
              <li>4. 🔄 Adăugare funcționalitate de căutare</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}