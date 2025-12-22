/**
 * FlightCard - Componentă pentru afișarea unui zbor individual
 * Design compact și modern, fără informații despre terminal și poartă
 */

'use client';

import { RawFlightData } from '@/lib/flightApiService';
import { formatDelayInRomanian } from '@/lib/flightUtils';
import { AirlineLogo } from '@/components/ui/AirlineLogo';
import { Plane, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface FlightCardProps {
  flight: RawFlightData;
  type: 'arrivals' | 'departures';
  className?: string;
}

export function FlightCard({ flight, type, className = '' }: FlightCardProps) {
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'landed':
      case 'arrived':
      case 'departed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'delayed':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'boarding':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'landed':
      case 'arrived':
      case 'departed':
        return <CheckCircle className="h-3 w-3" />;
      case 'delayed':
        return <AlertCircle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const relevantAirport = type === 'arrivals' ? flight.origin : flight.destination;
  const scheduledTime = flight.scheduled_time;
  const estimatedTime = flight.estimated_time;
  const isDelayed = estimatedTime && estimatedTime !== scheduledTime;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all ${className}`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <AirlineLogo 
            airlineCode={flight.airline.code}
            airlineName={flight.airline.name}
            size="sm"
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {flight.flight_number}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-24">
              {flight.airline.name}
            </p>
          </div>
        </div>
        
        {/* Compact Status */}
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(flight.status)}`}>
          {getStatusIcon(flight.status)}
          <span className="capitalize hidden sm:inline">{flight.status}</span>
        </div>
      </div>

      {/* Compact Route */}
      <div className="flex items-center space-x-1 mb-2">
        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <div className="flex items-center space-x-1 text-xs min-w-0">
          <span className="font-medium text-gray-900">
            {type === 'arrivals' ? 'Din' : 'Spre'}
          </span>
          <span className="text-gray-600 truncate">
            {relevantAirport.city}
          </span>
          <span className="text-gray-400 hidden sm:inline">
            ({relevantAirport.code})
          </span>
        </div>
      </div>

      {/* Compact Time Info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Programat</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatTime(scheduledTime)}
          </p>
        </div>

        {isDelayed ? (
          <div className="text-right">
            <p className="text-xs text-orange-600">Estimat</p>
            <p className="text-sm font-semibold text-orange-600">
              {formatTime(estimatedTime)}
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-xs text-green-600">La timp</p>
          </div>
        )}
      </div>

      {/* Compact Delay Info */}
      {flight.delay && flight.delay > 0 && (
        <div className="mt-2 flex items-center space-x-1 text-orange-600">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs font-medium">
            +{formatDelayInRomanian(flight.delay)}
          </span>
        </div>
      )}

      {/* Aircraft Info - Compact */}
      {flight.aircraft && (
        <div className="mt-1 text-xs text-gray-400 truncate">
          {flight.aircraft}
        </div>
      )}
    </div>
  );
}

export default FlightCard;