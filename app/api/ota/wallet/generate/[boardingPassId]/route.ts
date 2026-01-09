import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/ota/wallet/generate/[boardingPassId]
 * Proxy către modulul OTA pentru generarea Google Wallet
 */

const OTA_BASE_URL = process.env.OTA_BASE_URL || 'http://localhost:3002'

export async function POST(
  request: NextRequest,
  { params }: { params: { boardingPassId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      )
    }
    
    const { boardingPassId } = params
    
    // Proxy request către modulul OTA
    const response = await fetch(`${OTA_BASE_URL}/api/wallet/generate/${boardingPassId}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('OTA Wallet Generate Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la generarea Google Wallet link-ului',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}