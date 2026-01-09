import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/ota/boarding-passes
 * Proxy către modulul OTA pentru boarding passes
 */

const OTA_BASE_URL = process.env.OTA_BASE_URL || 'http://localhost:3002'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      )
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    // Proxy request către modulul OTA
    const response = await fetch(`${OTA_BASE_URL}/api/boarding-passes${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('OTA Boarding Passes Error:', error)
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