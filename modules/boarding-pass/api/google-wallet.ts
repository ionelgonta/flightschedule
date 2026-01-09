import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '../core/WalletService';
import { BoardingPassData } from '../types/boarding-pass';
import { BoardingPassParser } from '../core/BoardingPassParser';

/**
 * API endpoint dedicat pentru Google Wallet
 * Generează link-uri pentru boarding pass-uri existente
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boardingPassData } = body;

    if (!boardingPassData) {
      return NextResponse.json(
        { success: false, error: 'Boarding pass data is required' },
        { status: 400 }
      );
    }

    // Validează datele boarding pass-ului
    if (!BoardingPassParser.validateBoardingPassData(boardingPassData)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid boarding pass data provided',
          requiredFields: ['passengerName', 'flightNumber', 'origin', 'destination']
        },
        { status: 400 }
      );
    }

    // Generează link-ul Google Wallet
    const walletResult = await WalletService.generateWalletLink(boardingPassData);
    
    if (!walletResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: walletResult.error || 'Failed to generate wallet link'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        walletLink: walletResult.walletLink,
        debugInfo: walletResult.debugInfo
      }
    });

  } catch (error) {
    console.error('Error generating wallet link:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Endpoint pentru generarea unui link de test
export async function GET() {
  try {
    const testResult = await WalletService.generateTestLink();
    
    if (!testResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: testResult.error || 'Failed to generate test link' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        walletLink: testResult.walletLink,
        debugInfo: testResult.debugInfo,
        message: 'Test link generated successfully'
      }
    });

  } catch (error) {
    console.error('Error generating test wallet link:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Endpoint pentru validarea unui link Google Wallet
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletLink } = body;

    if (!walletLink) {
      return NextResponse.json(
        { success: false, error: 'Wallet link is required' },
        { status: 400 }
      );
    }

    const isValid = WalletService.validateWalletLink(walletLink);
    
    return NextResponse.json({
      success: true,
      data: {
        isValid: isValid,
        linkLength: walletLink.length,
        message: isValid ? 'Wallet link is valid' : 'Wallet link is invalid'
      }
    });

  } catch (error) {
    console.error('Error validating wallet link:', error);
    
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
export async function PATCH() {
  try {
    const testResult = await WalletService.testWalletConnection();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString(),
      configuration: {
        hasIssuerId: !!process.env.GOOGLE_WALLET_ISSUER_ID,
        hasPrivateKey: !!process.env.GOOGLE_WALLET_PRIVATE_KEY,
        hasServiceAccount: !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
      }
    });

  } catch (error) {
    console.error('Error testing wallet configuration:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Configuration test failed' 
      },
      { status: 500 }
    );
  }
}