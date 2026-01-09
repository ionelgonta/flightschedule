'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FlightData {
  passengerName: string;
  flightNumber: string;
  carrierCode: string;
  origin: string;
  destination: string;
  seatNumber: string;
  confirmationCode: string;
  compartment: string;
  flightDate?: string;
}

interface ProcessResult {
  success: boolean;
  flightData: FlightData;
  walletLink: string;
  bcbpData: string;
  validation: {
    originValid: boolean;
    destValid: boolean;
    domestic: boolean;
  };
}

interface PDFToWalletProcessorProps {
  className?: string;
}

export default function PDFToWalletProcessor({ className = '' }: PDFToWalletProcessorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bcbpInput, setBcbpInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<FlightData | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleProcess = async () => {
    if (!file && !bcbpInput.trim()) return;
    
    setProcessing(true);
    setError('');
    setResult(null);
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append('pdf', file);
      }
      if (bcbpInput.trim()) {
        formData.append('bcbp', bcbpInput.trim());
      }
      
      const response = await fetch('/api/boarding-pass/process', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || 'A apărut o eroare la procesare');
    } finally {
      setProcessing(false);
    }
  };

  const getAirlineName = (code: string) => {
    const airlines: Record<string, string> = {
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
    return airlines[code] || code;
  };

  const startEditing = () => {
    if (result) {
      setEditData({ ...result.flightData });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const saveEditing = async () => {
    if (!editData) return;
    
    setRegenerating(true);
    try {
      // Regenerează wallet link cu datele editate
      const response = await fetch('/api/google-wallet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (data.success && data.walletLink) {
        setResult({
          ...result!,
          flightData: editData,
          walletLink: data.walletLink
        });
        setIsEditing(false);
        setEditData(null);
      } else {
        throw new Error(data.error || 'Eroare la regenerare');
      }
    } catch (err: any) {
      setError(err.message || 'Eroare la salvarea modificărilor');
    } finally {
      setRegenerating(false);
    }
  };

  const getAirportName = (code: string) => {
    const airports: Record<string, string> = {
      'OTP': 'București (Henri Coandă)',
      'BBU': 'București (Aurel Vlaicu)',
      'CLJ': 'Cluj-Napoca',
      'TSR': 'Timișoara',
      'IAS': 'Iași',
      'CND': 'Constanța',
      'SBZ': 'Sibiu',
      'CRA': 'Craiova',
      'BCM': 'Bacău',
      'RMO': 'Chișinău',
      'LHR': 'London Heathrow',
      'FRA': 'Frankfurt',
      'CDG': 'Paris Charles de Gaulle'
    };
    return airports[code] || code;
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🎫 PDF Boarding Pass Processor
          </h2>
          <p className="text-blue-100">
            Upload PDF-ul sau introdu BCBP manual pentru a genera link Google Wallet
          </p>
        </div>

        <div className="p-8">
          {/* Upload Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            
            {/* PDF Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📄 Upload PDF Boarding Pass
              </h3>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-green-600 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm underline"
                    >
                      Șterge fișierul
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {isDragActive ? 'Eliberează pentru upload' : 'Drag & drop PDF aici'}
                    </p>
                    <p className="text-gray-500 text-sm">sau click pentru a selecta fișierul</p>
                    <p className="text-xs text-gray-400">Doar fișiere PDF, max 10MB</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Manual BCBP Input */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✏️ Sau introdu BCBP manual
              </h3>
              
              <textarea
                value={bcbpInput}
                onChange={(e) => setBcbpInput(e.target.value)}
                placeholder="M1POPESCU/ANDREI        E789012 OTPTSR RO456015Y012B0030 148"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="mt-3 text-xs text-gray-500">
                Introdu codul BCBP (Bar Coded Boarding Pass) din PDF sau de pe boarding pass
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleProcess}
              disabled={(!file && !bcbpInput.trim()) || processing}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg disabled:from-gray-300 disabled:to-gray-400 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:shadow-none"
            >
              {processing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesez...
                </span>
              ) : (
                '🚀 Generează Google Wallet Link'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-800">Eroare la procesare</h4>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg overflow-hidden">
              
              {/* Results Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Boarding Pass Procesat cu Succes!
                </h3>
                {!isEditing && (
                  <button
                    onClick={startEditing}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editează
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* Edit Mode */}
                {isEditing && editData ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">👤 Nume Pasager</label>
                        <input
                          type="text"
                          value={editData.passengerName}
                          onChange={(e) => setEditData({ ...editData, passengerName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">✈️ Cod Companie</label>
                        <input
                          type="text"
                          value={editData.carrierCode}
                          onChange={(e) => setEditData({ ...editData, carrierCode: e.target.value.toUpperCase() })}
                          maxLength={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🔢 Număr Zbor</label>
                        <input
                          type="text"
                          value={editData.flightNumber}
                          onChange={(e) => setEditData({ ...editData, flightNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🛫 Aeroport Plecare</label>
                        <input
                          type="text"
                          value={editData.origin}
                          onChange={(e) => setEditData({ ...editData, origin: e.target.value.toUpperCase() })}
                          maxLength={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🛬 Aeroport Sosire</label>
                        <input
                          type="text"
                          value={editData.destination}
                          onChange={(e) => setEditData({ ...editData, destination: e.target.value.toUpperCase() })}
                          maxLength={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📅 Data Zbor</label>
                        <input
                          type="date"
                          value={editData.flightDate || ''}
                          onChange={(e) => setEditData({ ...editData, flightDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💺 Loc</label>
                        <input
                          type="text"
                          value={editData.seatNumber}
                          onChange={(e) => setEditData({ ...editData, seatNumber: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🎫 PNR/Confirmare</label>
                        <input
                          type="text"
                          value={editData.confirmationCode || ''}
                          onChange={(e) => setEditData({ ...editData, confirmationCode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🎟️ Clasă</label>
                        <select
                          value={editData.compartment}
                          onChange={(e) => setEditData({ ...editData, compartment: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Y">Economy (Y)</option>
                          <option value="C">Business (C)</option>
                          <option value="F">First (F)</option>
                          <option value="W">Premium Economy (W)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Anulează
                      </button>
                      <button
                        onClick={saveEditing}
                        disabled={regenerating}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center"
                      >
                        {regenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvez...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Salvează și Regenerează Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Flight Details */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👤</span>
                      <div>
                        <div className="text-sm text-gray-600">Pasager</div>
                        <div className="font-semibold text-gray-900">{result.flightData.passengerName}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">✈️</span>
                      <div>
                        <div className="text-sm text-gray-600">Zbor</div>
                        <div className="font-semibold text-gray-900">
                          {getAirlineName(result.flightData.carrierCode)} {result.flightData.carrierCode}{result.flightData.flightNumber}
                        </div>
                        {result.flightData.flightDate && (
                          <div className="text-xs text-gray-500">
                            📅 {new Date(result.flightData.flightDate).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🛫</span>
                      <div>
                        <div className="text-sm text-gray-600">Plecare</div>
                        <div className="font-semibold text-gray-900">{getAirportName(result.flightData.origin)}</div>
                        <div className="text-xs text-gray-500">{result.flightData.origin}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🛬</span>
                      <div>
                        <div className="text-sm text-gray-600">Sosire</div>
                        <div className="font-semibold text-gray-900">{getAirportName(result.flightData.destination)}</div>
                        <div className="text-xs text-gray-500">{result.flightData.destination}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💺</span>
                      <div>
                        <div className="text-sm text-gray-600">Loc</div>
                        <div className="font-semibold text-gray-900">{result.flightData.seatNumber}</div>
                        <div className="text-xs text-gray-500">Clasa {result.flightData.compartment}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎫</span>
                      <div>
                        <div className="text-sm text-gray-600">PNR</div>
                        <div className="font-semibold text-gray-900">{result.flightData.confirmationCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Status */}
                <div className="mb-6 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {result.validation.domestic ? '🏠' : '🌍'}
                      </span>
                      <span className="font-medium">
                        {result.validation.domestic ? 'Zbor intern România' : 'Zbor internațional'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.flightData.origin} → {result.flightData.destination}
                    </div>
                  </div>
                </div>

                {/* BCBP Data */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">📊 Date BCBP (IATA Standard):</div>
                  <code className="block text-xs break-all font-mono text-gray-600 bg-white p-2 rounded border">
                    {result.bcbpData}
                  </code>
                </div>

                {/* Google Wallet Button */}
                <div className="text-center">
                  <a
                    href={result.walletLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    🎫 Adaugă în Google Wallet
                  </a>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  Link length: {result.walletLink.length} caractere | 
                  <span className="ml-1">Generat cu formula de succes confirmată</span>
                </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Test Examples */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">🧪 Exemple de testare (Click pentru a folosi):</h4>
            <div className="space-y-3">
              <button
                onClick={() => setBcbpInput("M1POPESCU/ANDREI        E789012 OTPTSR RO456015Y012B0030 148")}
                className="block w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">TAROM RO456 - București → Timișoara</div>
                    <div className="text-sm text-gray-600">Pasager: ANDREI POPESCU | Loc: 012B</div>
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    M1POPESCU/ANDREI...
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setBcbpInput("M1GONTA/OTILIA         OHTDRI RMOOTPW4 3040 363Y035B0116 100")}
                className="block w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Wizz Air W43040</div>
                    <div className="text-sm text-gray-600">Pasager: OTILIA GONTA | Loc: 035B</div>
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    M1GONTA/OTILIA...
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}