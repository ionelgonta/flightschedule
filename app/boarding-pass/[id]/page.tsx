'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Known carriers for airline name lookup
const KNOWN_CARRIERS: Record<string, string> = {
  '5F': 'FlyOne', 'RO': 'TAROM', 'W4': 'Wizz Air', 'W6': 'Wizz Air', 'WZ': 'Wizz Air',
  'H4': 'HiSky', '0B': 'Blue Air', '9U': 'Air Moldova',
  'LH': 'Lufthansa', 'FR': 'Ryanair', 'BA': 'British Airways', 'KL': 'KLM', 'AF': 'Air France',
  'LX': 'Swiss', 'OS': 'Austrian', 'AZ': 'ITA Airways', 'IB': 'Iberia', 'VY': 'Vueling',
  'U2': 'easyJet', 'EW': 'Eurowings', 'EI': 'Aer Lingus', 'SK': 'SAS', 'AY': 'Finnair',
  'SN': 'Brussels Airlines', 'TP': 'TAP Portugal', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'AA': 'American Airlines', 'DL': 'Delta', 'UA': 'United',
  'PC': 'Pegasus', 'A3': 'Aegean', 'JU': 'Air Serbia', 'OU': 'Croatia Airlines',
  'LO': 'LOT Polish', 'OK': 'Czech Airlines', 'BT': 'airBaltic',
  'QS': 'SmartWings', 'V7': 'Volotea', 'XR': 'Corendon', 'DE': 'Condor', 'XQ': 'SunExpress'
};

const KNOWN_AIRPORTS: Record<string, { city: string; name: string }> = {
  'OTP': { city: 'București', name: 'Henri Coandă' },
  'BBU': { city: 'București', name: 'Aurel Vlaicu' },
  'CLJ': { city: 'Cluj-Napoca', name: 'Avram Iancu' },
  'TSR': { city: 'Timișoara', name: 'Traian Vuia' },
  'IAS': { city: 'Iași', name: 'International' },
  'CND': { city: 'Constanța', name: 'Mihail Kogălniceanu' },
  'SBZ': { city: 'Sibiu', name: 'International' },
  'CRA': { city: 'Craiova', name: 'International' },
  'BCM': { city: 'Bacău', name: 'George Enescu' },
  'RMO': { city: 'Chișinău', name: 'International' },
  'LHR': { city: 'Londra', name: 'Heathrow' },
  'LTN': { city: 'Londra', name: 'Luton' },
  'STN': { city: 'Londra', name: 'Stansted' },
  'LGW': { city: 'Londra', name: 'Gatwick' },
  'CDG': { city: 'Paris', name: 'Charles de Gaulle' },
  'ORY': { city: 'Paris', name: 'Orly' },
  'FRA': { city: 'Frankfurt', name: 'Main' },
  'AMS': { city: 'Amsterdam', name: 'Schiphol' },
  'FCO': { city: 'Roma', name: 'Fiumicino' },
  'MUC': { city: 'München', name: 'Franz Josef Strauss' },
  'VIE': { city: 'Viena', name: 'Schwechat' },
  'BRU': { city: 'Bruxelles', name: 'Zaventem' },
  'MAD': { city: 'Madrid', name: 'Barajas' },
  'BCN': { city: 'Barcelona', name: 'El Prat' },
};

interface BoardingPass {
  id: string;
  createdAt: string;
  passengerName: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  flightDate: string | null;
  departureTime: string | null;
  seatNumber: string | null;
  compartment: string;
  confirmationCode: string | null;
  gate: string | null;
  boardingTime: string | null;
  walletLink: string | null;
  pdfFileName: string | null;
  barcodeImage: string | null;
  raw: string | null;
}

interface GeneratedBarcode {
  image: string;
  type: string;
  detectedType: string;
  dataLength: number;
}

export default function BoardingPassPublicPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [boardingPass, setBoardingPass] = useState<BoardingPass | null>(null);
  const [generatedBarcode, setGeneratedBarcode] = useState<GeneratedBarcode | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchBoardingPass = async () => {
      try {
        const response = await fetch(`/api/boarding-pass/${id}`);
        const data = await response.json();

        if (data.success) {
          setBoardingPass(data.boardingPass);
          
          // Fetch generated barcode if raw data exists
          if (data.boardingPass.raw) {
            setBarcodeLoading(true);
            try {
              const barcodeResponse = await fetch(`/api/boarding-pass/${id}/barcode`);
              const barcodeData = await barcodeResponse.json();
              if (barcodeData.success) {
                setGeneratedBarcode(barcodeData.barcode);
              }
            } catch (barcodeErr) {
              console.error('Failed to generate barcode:', barcodeErr);
            } finally {
              setBarcodeLoading(false);
            }
          }
        } else {
          setError(data.error || 'Boarding pass not found');
        }
      } catch (err) {
        setError('Failed to load boarding pass');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingPass();
  }, [id]);

  const getAirlineName = (code: string) => KNOWN_CARRIERS[code] || code;
  const getAirportInfo = (code: string) => KNOWN_AIRPORTS[code] || { city: code, name: '' };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getCompartmentName = (code: string) => {
    const compartments: Record<string, string> = {
      'F': 'First Class',
      'C': 'Business Class',
      'W': 'Premium Economy',
      'Y': 'Economy'
    };
    return compartments[code] || 'Economy';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Se încarcă boarding pass-ul...</p>
        </div>
      </div>
    );
  }

  if (error || !boardingPass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Boarding Pass Negăsit</h1>
          <p className="text-gray-600 mb-6">{error || 'Acest boarding pass nu există sau a expirat.'}</p>
          <a 
            href="https://anyway.ro"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Înapoi la Anyway.ro
          </a>
        </div>
      </div>
    );
  }

  const originInfo = getAirportInfo(boardingPass.origin);
  const destInfo = getAirportInfo(boardingPass.destination);
  const airlineName = getAirlineName(boardingPass.carrierCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-4 px-3">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-semibold text-white">✈️ Boarding Pass</h1>
        </div>

        {/* Boarding Pass Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Airline Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-xs">Companie aeriană</p>
                <p className="text-white text-lg font-bold">{airlineName}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs">Zbor</p>
                <p className="text-white text-xl font-bold">{boardingPass.carrierCode} {boardingPass.flightNumber}</p>
              </div>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-gray-500 text-xs">👤 Pasager</p>
            <p className="text-xl font-bold text-gray-900">{boardingPass.passengerName}</p>
          </div>

          {/* Route Section */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Origin */}
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-gray-900">{boardingPass.origin}</p>
                <p className="text-sm text-gray-600">{originInfo.city}</p>
                <p className="text-xs text-gray-400">{originInfo.name}</p>
              </div>

              {/* Flight Path */}
              <div className="flex-1 px-2">
                <div className="relative">
                  <div className="border-t-2 border-dashed border-gray-300"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                    <span className="text-xl">✈️</span>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-gray-900">{boardingPass.destination}</p>
                <p className="text-sm text-gray-600">{destInfo.city}</p>
                <p className="text-xs text-gray-400">{destInfo.name}</p>
              </div>
            </div>
          </div>

          {/* Date Row */}
          <div className="px-4 py-2 bg-gray-50 border-t">
            <div className="text-center">
              <p className="text-gray-500 text-xs">📅 Data</p>
              <p className="font-semibold text-gray-900 text-sm">{formatDate(boardingPass.flightDate)}</p>
            </div>
          </div>

          {/* Time and Seat Row */}
          <div className="px-4 py-2 bg-gray-50 grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 text-xs">🕐 Ora plecare</p>
              <p className="font-bold text-xl text-gray-900">{boardingPass.departureTime || 'N/A'}</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500 text-xs">💺 Loc</p>
              <p className="font-bold text-xl text-blue-600">{boardingPass.seatNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Gate if available */}
          {boardingPass.gate && (
            <div className="px-4 py-2 bg-gray-50">
              <div className="text-center p-2 bg-white rounded-lg shadow-sm max-w-xs mx-auto">
                <p className="text-gray-500 text-xs">🚪 Poartă</p>
                <p className="font-bold text-lg text-gray-900">{boardingPass.gate}</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="px-4 py-2 grid grid-cols-2 gap-3 border-t">
            {boardingPass.confirmationCode && (
              <div>
                <p className="text-gray-500 text-xs">🎫 PNR</p>
                <p className="font-mono font-bold text-base text-gray-900">{boardingPass.confirmationCode}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">🎟️ Clasă</p>
              <p className="font-semibold text-sm text-gray-900">{getCompartmentName(boardingPass.compartment)}</p>
            </div>
            {boardingPass.boardingTime && (
              <div>
                <p className="text-gray-500 text-xs">⏰ Îmbarcare</p>
                <p className="font-semibold text-sm text-gray-900">{boardingPass.boardingTime}</p>
              </div>
            )}
          </div>

          {/* Generated Barcode Section - Before Google Wallet */}
          {generatedBarcode && !barcodeLoading && (
            <div className="px-3 py-3 bg-white border-t">
              <img 
                src={generatedBarcode.image} 
                alt="Boarding Pass Barcode"
                className="mx-auto"
                style={{ 
                  maxWidth: '100%', 
                  width: generatedBarcode.type === 'pdf417' ? '100%' : 'auto',
                  maxHeight: generatedBarcode.type === 'pdf417' ? '70px' : '180px',
                  height: 'auto'
                }}
              />
            </div>
          )}

          {/* Google Wallet Button */}
          {boardingPass.walletLink && (
            <div className="px-3 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-t">
              <a
                href={boardingPass.walletLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-bold text-base shadow-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Adaugă în Google Wallet
              </a>
            </div>
          )}

          {/* PDF Download Button */}
          {boardingPass.pdfFileName && (
            <div className="px-3 py-2 bg-gray-50 border-t">
              <a
                href={`/api/boarding-pass/${boardingPass.id}/pdf`}
                download
                className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg text-sm font-medium transition-all"
              >
                📄 Descarcă PDF
              </a>
            </div>
          )}

          {/* Barcode Image - DISABLED until better technical solution
          {boardingPass.barcodeImage && (
            <div className="px-3 py-3 bg-white border-t">
              <p className="text-gray-500 text-xs text-center mb-2">📊 Cod de bare</p>
              <img 
                src={boardingPass.barcodeImage} 
                alt="Boarding Pass Barcode"
                style={{ width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '0 auto' }}
                className="rounded-lg shadow-sm"
              />
            </div>
          )}
          */}

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-100 text-center">
            <p className="text-xs text-gray-500">
              ID: {boardingPass.id} • {new Date(boardingPass.createdAt).toLocaleDateString('ro-RO')}
            </p>
          </div>
        </div>

        {/* Instructions - more compact */}
        <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-4 text-white">
          <h3 className="font-bold text-sm mb-2">📱 Instrucțiuni</h3>
          <ul className="space-y-1 text-blue-100 text-sm">
            <li>1. Apasă "Adaugă în Google Wallet"</li>
            <li>2. Confirmă în aplicația Google Wallet</li>
            <li>3. Prezintă boarding pass-ul la aeroport</li>
          </ul>
        </div>

        {/* Anyway.ro Branding */}
        <div className="mt-4 text-center">
          <a href="https://anyway.ro" className="text-blue-200 hover:text-white transition-colors text-sm">
            Powered by Colibri24. Copyright 2026
          </a>
        </div>
      </div>
    </div>
  );
}
