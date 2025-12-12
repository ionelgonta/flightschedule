/**
 * FlightCard - Componentă pentru afișarea unui zbor individual
 * Design minimalist cu informații complete
 */

'use client';

import { RawFlightData } from '@/lib/flightApiService';
import { formatDelayInRomanian } from '@/lib/demoFlightData';
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
        return <CheckCircle className="h-4 w-4" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const relevantAirport = type === 'arrivals' ? flight.origin : flight.destination;
  const scheduledTime = flight.scheduled_time;
  const estimatedTime = flight.estimated_time;
  const isDelayed = estimatedTime && estimatedTime !== scheduledTime;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header cu numărul zborului și compania */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {flight.flight_number}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {flight.airline.name}
            </p>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(flight.status)}`}>
          {getStatusIcon(flight.status)}
          <span className="capitalize">{flight.status}</span>
        </div>
      </div>

      {/* Ruta și destinația */}
      <div className="flex items-center space-x-2 mb-3">
        <MapPin className="h-4 w-4 text-gray-400" />
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-900 dark:text-white">
            {type === 'arrivals' ? 'Din' : 'Spre'}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {relevantAirport.city} ({relevantAirport.code})
          </span>
        </div>
      </div>

      {/* Orele și detaliile */}
      <div className="grid grid-cols-2 gap-4">
        {/* Ora programată */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ora programată
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatTime(scheduledTime)}
          </p>
        </div>

        {/* Ora estimată */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {isDelayed ? 'Ora estimată' : 'Status'}
          </p>
          {isDelayed ? (
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {formatTime(estimatedTime)}
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              La timp
            </p>
          )}
        </div>
      </div>

      {/* Terminal și poarta */}
      {(flight.terminal || flight.gate) && (
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {flight.terminal && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Terminal:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {flight.terminal}
              </span>
            </div>
          )}
          {flight.gate && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Poarta:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {flight.gate}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Întârzierea */}
      {flight.delay && flight.delay > 0 && (
        <div className="mt-2 flex items-center space-x-1 text-orange-600 dark:text-orange-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Întârziere: {formatDelayInRomanian(flight.delay)}
          </span>
        </div>
      )}

      {/* Aeronava */}
      {flight.aircraft && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Aeronava: {flight.aircraft}
        </div>
      )}
    </div>
  );
}

export default FlightCard;