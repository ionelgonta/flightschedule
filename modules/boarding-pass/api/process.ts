import { NextRequest, NextResponse } from 'next/server';
import { PDFProcessor } from '../lib/pdf-processor';
import { WalletService } from '../core/WalletService';
import { BoardingPassParser } from '../core/BoardingPassParser';

/**
 * API endpoint pentru procesarea boarding pass-urilor
 * Poate fi folosit independent sau integrat în aplicația principală
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validează că este un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Procesează PDF-ul
    const pdfResult = await PDFProcessor.processPDF(file);
    
    if (!pdfResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: pdfResult.error || 'Failed to process PDF',
          extractedText: pdfResult.text // Pentru debugging
        },
        { status: 400 }
      );
    }

    if (!pdfResult.boardingPassData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No boarding pass data found in PDF',
          extractedText: pdfResult.text // Pentru debugging
        },
        { status: 400 }
      );
    }

    // Validează datele boarding pass-ului
    if (!BoardingPassParser.validateBoardingPassData(pdfResult.boardingPassData)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid boarding pass data extracted',
          boardingPassData: pdfResult.boardingPassData // Pentru debugging
        },
        { status: 400 }
      );
    }

    // Generează link-ul Google Wallet
    const walletResult = await WalletService.generateWalletLink(pdfResult.boardingPassData);
    
    if (!walletResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: walletResult.error || 'Failed to generate wallet link',
          boardingPassData: pdfResult.boardingPassData // Returnează datele chiar dacă wallet-ul a eșuat
        },
        { status: 500 }
      );
    }

    // Succes complet
    return NextResponse.json({
      success: true,
      data: {
        boardingPassData: pdfResult.boardingPassData,
        walletLink: walletResult.walletLink,
        extractedText: pdfResult.text,
        barcodeData: pdfResult.barcodeData,
        debugInfo: walletResult.debugInfo
      }
    });

  } catch (error) {
    console.error('Error processing boarding pass:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Endpoint pentru procesarea simplă (doar extragerea datelor, fără Google Wallet)
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Procesează doar PDF-ul, fără Google Wallet
    const pdfResult = await PDFProcessor.processPDF(file);
    
    return NextResponse.json({
      success: pdfResult.success,
      data: {
        boardingPassData: pdfResult.boardingPassData,
        extractedText: pdfResult.text,
        barcodeData: pdfResult.barcodeData
      },
      error: pdfResult.error
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Endpoint pentru testarea configurației Google Wallet
export async function GET() {
  try {
    const testResult = await WalletService.testWalletConnection();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing wallet connection:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      },
      { status: 500 }
    );
  }
}