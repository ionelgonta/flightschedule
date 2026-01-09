import { NextRequest, NextResponse } from 'next/server';
// Folosește modulul boarding-pass izolat
import { BoardingPassModule } from '@/modules/boarding-pass';

/**
 * API endpoint modernizat care folosește modulul boarding-pass izolat
 * Înlocuiește logica hardcodată cu modulul reutilizabil
 */
export async function POST(request: NextRequest) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('🚀 Modular API Request received');
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const manualBCBP = formData.get('bcbp') as string;
    
    console.log('Request data:', { 
      hasFile: !!file, 
      fileSize: file?.size, 
      hasManualBCBP: !!manualBCBP 
    });

    // Validări de bază
    if (!file && !manualBCBP) {
      return NextResponse.json({ 
        success: false,
        error: 'Nu a fost furnizat niciun PDF sau cod BCBP.' 
      }, { status: 400, headers });
    }

    if (file) {
      // Verifică dimensiunea fișierului (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          success: false,
          error: 'Fișierul PDF este prea mare. Dimensiunea maximă permisă este 10MB.' 
        }, { status: 400, headers });
      }
      
      // Verifică tipul fișierului
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ 
          success: false,
          error: 'Tipul fișierului nu este valid. Doar fișiere PDF sunt acceptate.' 
        }, { status: 400, headers });
      }

      console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);
      
      // Procesează PDF-ul folosind modulul
      const result = await BoardingPassModule.processFile(file);
      
      console.log(`Modular processing successful:`, {
        passenger: result.boardingPassData.passengerName,
        flight: `${result.boardingPassData.carrierCode}${result.boardingPassData.flightNumber}`,
        route: `${result.boardingPassData.origin} → ${result.boardingPassData.destination}`
      });

      // Validează aeroporturile (conform airport-mapping-rules.md)
      const validAirports = ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO'];
      
      const validation = {
        originValid: validAirports.includes(result.boardingPassData.origin),
        destValid: validAirports.includes(result.boardingPassData.destination),
        domestic: validAirports.includes(result.boardingPassData.origin) && validAirports.includes(result.boardingPassData.destination)
      };

      return NextResponse.json({
        success: true,
        flightData: result.boardingPassData,
        walletLink: result.walletLink,
        bcbpData: result.barcodeData?.data || result.boardingPassData.bcbpData,
        extractedText: result.extractedText,
        validation,
        processingMethod: 'modular'
      }, { headers });

    } else if (manualBCBP) {
      console.log(`Manual BCBP provided: ${manualBCBP.substring(0, 50)}...`);
      
      // Parsează BCBP manual folosind modulul
      const { BoardingPassParser } = await import('@/modules/boarding-pass');
      const boardingPassData = BoardingPassParser.parseFromBCBP(manualBCBP);
      
      if (!boardingPassData) {
        return NextResponse.json({ 
          success: false,
          error: 'Nu s-au putut extrage datele din codul BCBP furnizat.' 
        }, { status: 400, headers });
      }

      // Generează link Google Wallet
      const walletResult = await BoardingPassModule.generateWalletLink(boardingPassData);
      
      if (!walletResult.success) {
        return NextResponse.json({ 
          success: false,
          error: walletResult.error || 'Nu s-a putut genera link-ul Google Wallet.' 
        }, { status: 500, headers });
      }

      // Validează aeroporturile
      const validAirports = ['OTP', 'CLJ', 'TSR', 'IAS', 'CND', 'SBZ', 'CRA', 'BCM', 'BAY', 'OMR', 'SCV', 'TGM', 'ARW', 'SUJ', 'GHV', 'RMO'];
      
      const validation = {
        originValid: validAirports.includes(boardingPassData.origin),
        destValid: validAirports.includes(boardingPassData.destination),
        domestic: validAirports.includes(boardingPassData.origin) && validAirports.includes(boardingPassData.destination)
      };

      return NextResponse.json({
        success: true,
        flightData: boardingPassData,
        walletLink: walletResult.walletLink,
        bcbpData: manualBCBP,
        validation,
        processingMethod: 'manual-bcbp'
      }, { headers });
    }
    
  } catch (error: any) {
    console.error('Modular processing error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'A apărut o eroare la procesarea boarding pass-ului.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      processingMethod: 'modular'
    }, { status: 500, headers });
  }
}

// Endpoint pentru testarea configurației modulului
export async function GET() {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Testează configurația modulului
    const configTest = await BoardingPassModule.testConfiguration();
    
    // Verifică suportul browser-ului
    const browserSupport = BoardingPassModule.checkBrowserSupport();
    
    return NextResponse.json({
      success: true,
      configuration: configTest,
      browserSupport: browserSupport,
      timestamp: new Date().toISOString(),
      module: 'boarding-pass-modular'
    }, { headers });
    
  } catch (error: any) {
    console.error('Configuration test error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Configuration test failed',
      timestamp: new Date().toISOString()
    }, { status: 500, headers });
  }
}