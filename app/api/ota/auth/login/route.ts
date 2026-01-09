import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/ota/auth/login
 * Proxy către modulul OTA pentru autentificare
 */

const OTA_BASE_URL = process.env.OTA_BASE_URL || 'http://localhost:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Proxy request către modulul OTA
    const response = await fetch(`${OTA_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('OTA Auth Login Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare de conexiune la modulul OTA',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}