import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: /api/ota/boarding-passes/upload
 * Proxy către modulul OTA pentru upload boarding pass
 */

const OTA_BASE_URL = process.env.OTA_BASE_URL || 'http://localhost:3002'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      )
    }
    
    // Get form data from request
    const formData = await request.formData()
    
    // Proxy request către modulul OTA
    const response = await fetch(`${OTA_BASE_URL}/api/boarding-passes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('OTA Boarding Pass Upload Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare la încărcarea boarding pass-ului',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}