'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { BCBPData } from '../lib/mlkit-barcode';

interface BarcodeScannerProps {
  onBarcodeDetected: (bcbpData: BCBPData) => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ onBarcodeDetected, onError }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<BCBPData | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Parse BCBP (Bar Coded Boarding Pass) data according to IATA Resolution 792
  const parseBCBP = useCallback((rawData: string): BCBPData | null => {
    try {
      // BCBP format: M1LASTNAME/FIRSTNAME ETICKET_NUMBER ORIGIN_DEST CARRIER DATE_SEAT_INFO
      // Example: M1GONTA/IONEL ELH4820 OTPLHR LH 007Y015A0025 100
      
      if (!rawData.startsWith('M1') && !rawData.startsWith('M2')) {
        throw new Error('Invalid BCBP format - must start with M1 or M2');
      }

      // Extract passenger name (positions 2-22)
      const passengerSection = rawData.substring(2, 22).trim();
      const nameParts = passengerSection.split('/');
      const lastName = nameParts[0]?.trim() || '';
      const firstName = nameParts[1]?.trim() || '';
      const passengerName = `${firstName} ${lastName}`.trim();

      // Extract flight info (positions 23-43)
      const flightSection = rawData.substring(23, 43).trim();
      
      // Extract origin/destination (6 chars: 3 origin + 3 destination)
      const routeMatch = rawData.match(/([A-Z]{3})([A-Z]{3})/);
      const origin = routeMatch?.[1] || '';
      const destination = routeMatch?.[2] || '';

      // Extract carrier code (2 letters)
      const carrierMatch = rawData.match(/\s([A-Z]{2})\s/);
      const carrierCode = carrierMatch?.[1] || '';

      // Extract flight number (from carrier code context)
      const flightMatch = rawData.match(/([A-Z]{2})(\d{1,4})/);
      const flightNumber = flightMatch?.[2] || '';

      // Extract seat number (format: 015A = seat 15A)
      const seatMatch = rawData.match(/(\d{3})([A-Z])/);
      let seatNumber = '';
      if (seatMatch) {
        const seatNum = parseInt(seatMatch[1]).toString();
        const seatLetter = seatMatch[2];
        seatNumber = `${seatNum}${seatLetter}`;
      }

      // Extract boarding group (usually after seat info)
      const boardingMatch = rawData.match(/([A-Z])\d{3}$/);
      const boardingGroup = boardingMatch?.[1] || '';

      // Generate confirmation code from flight data
      const confirmationCode = `${carrierCode}${flightNumber.slice(-2)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

      return {
        passengerName,
        lastName,
        firstName,
        flightNumber,
        carrierCode,
        origin,
        destination,
        seatNumber,
        boardingGroup,
        confirmationCode,
        rawBCBP: rawData,
        parsedSuccessfully: true
      };
    } catch (error) {
      console.error('BCBP parsing error:', error);
      return null;
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Nu pot accesa camera. Verifică permisiunile.');
      setHasPermission(false);
      onError?.('Camera access denied');
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    cleanup();
    setIsScanning(false);
  }, [cleanup]);

  // Scan for barcodes using canvas and ML Kit (simulated)
  const scanForBarcodes = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // In a real implementation, you would use Google ML Kit here
      // For now, we'll simulate barcode detection
      
      // Get image data from canvas
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Simulate ML Kit barcode detection
      // In reality, you would call: BarcodeScanner.detectFromImage(imageData)
      await simulateBarcodeDetection(imageData);
      
    } catch (error) {
      console.error('Barcode scanning error:', error);
    }
  }, [isScanning]);

  // Simulate barcode detection (replace with actual ML Kit implementation)
  const simulateBarcodeDetection = useCallback(async (imageData: string) => {
    // This is a simulation - in real implementation, use Google ML Kit
    // For demo purposes, we'll detect a sample BCBP when user clicks
    
    // Sample BCBP data for testing
    const sampleBCBP = "M1GONTA/IONEL       ELH4820 OTPLHR LH 007Y015A0025 100";
    
    // In real ML Kit implementation:
    // const barcodes = await BarcodeScanner.detectFromImage(imageData);
    // barcodes.forEach(barcode => {
    //   if (barcode.format === 'PDF417' || barcode.format === 'QR_CODE') {
    //     const bcbpData = parseBCBP(barcode.rawValue);
    //     if (bcbpData) {
    //       handleBarcodeDetected(bcbpData);
    //     }
    //   }
    // });
  }, []);

  // Handle barcode detection
  const handleBarcodeDetected = useCallback((bcbpData: BCBPData) => {
    setDetectedData(bcbpData);
    stopCamera();
    onBarcodeDetected(bcbpData);
  }, [onBarcodeDetected, stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      
      // Create image element for processing
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // In real implementation, use ML Kit here
        // const barcodes = await BarcodeScanner.detectFromImage(imageData);
        
        // For demo, parse sample BCBP
        const sampleBCBP = "M1GONTA/IONEL       ELH4820 OTPLHR LH 007Y015A0025 100";
        const bcbpData = parseBCBP(sampleBCBP);
        
        if (bcbpData) {
          handleBarcodeDetected(bcbpData);
        } else {
          setError('Nu am găsit un cod de bare valid în imagine.');
        }
      };

      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      setError('Eroare la procesarea imaginii.');
    }
  }, [parseBCBP, handleBarcodeDetected]);

  // Start scanning interval when camera is active
  useEffect(() => {
    if (isScanning && videoRef.current) {
      scanIntervalRef.current = setInterval(scanForBarcodes, 1000); // Scan every second
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning, scanForBarcodes]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scanează Boarding Pass
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {detectedData && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Boarding Pass Detectat!</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Pasager:</strong> {detectedData.passengerName}</p>
              <p><strong>Zbor:</strong> {detectedData.carrierCode}{detectedData.flightNumber}</p>
              <p><strong>Rută:</strong> {detectedData.origin} → {detectedData.destination}</p>
              {detectedData.seatNumber && <p><strong>Loc:</strong> {detectedData.seatNumber}</p>}
            </div>
          </div>
        )}

        {!isScanning && !detectedData && (
          <div className="space-y-4">
            <button
              onClick={startCamera}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-5 w-5 mr-2" />
              Scanează cu Camera
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">sau</span>
              </div>
            </div>

            <label className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
              <Upload className="h-5 w-5 mr-2" />
              Încarcă Imagine
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-md object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 border-2 border-blue-500 rounded-md">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Poziționează codul de bare în cadru
              </p>
              <button
                onClick={stopCamera}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mx-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Oprește Scanarea
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}