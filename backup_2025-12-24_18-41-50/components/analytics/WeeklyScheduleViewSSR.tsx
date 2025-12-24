import { Calendar } from 'lucide-react'

interface WeeklyScheduleData {
  airport: string;
  destination: string;
  airline: string;
  flightNumber: string;
  weeklyPattern: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  frequency: number;
  lastUpdated: string;
  dataSource: 'cache' | 'historical';
}

async function getWeeklyScheduleData(): Promise<WeeklyScheduleData[]> {
  try {
    // Import the analyzer directly on the server side
    const { getWeeklyScheduleAnalyzer } = await import('@/lib/weeklyScheduleAnalyzer')
    const analyzer = getWeeklyScheduleAnalyzer()
    const data = await analyzer.getScheduleData()
    return data
  } catch (error) {
    console.error('Error loading weekly schedule data:', error)
    return []
  }
}

export default async function WeeklyScheduleViewSSR() {
  const scheduleData = await getWeeklyScheduleData()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Program Săptămânal Zboruri (Server-Side)
            </h3>
            <p className="text-sm text-gray-600">
              {scheduleData.length} rute disponibile
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {scheduleData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nu sunt date disponibile</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">
              Primele 20 rute (Server-Side Rendered):
            </h4>
            <div className="space-y-2">
              {scheduleData.slice(0, 20).map((route, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{route.airport} → {route.destination}</span>
                      <div className="text-sm text-gray-600">
                        {route.airline} {route.flightNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Zile: {Object.entries(route.weeklyPattern)
                          .filter(([_, active]) => active)
                          .map(([day, _]) => day.charAt(0).toUpperCase())
                          .join(', ')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.frequency} zboruri
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {scheduleData.length > 20 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  ... și încă {scheduleData.length - 20} rute
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}