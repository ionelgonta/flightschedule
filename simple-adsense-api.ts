import { NextRequest, NextResponse } from 'next/server'

// Simple AdSense API for testing
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      publisherId: 'ca-pub-2305349540791838',
      hasPublisherId: true,
      message: 'AdSense API is working!'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { publisherId, action } = await request.json()
    
    if (action === 'test') {
      const isValid = publisherId && publisherId.startsWith('ca-pub-') && publisherId.length === 22
      
      return NextResponse.json({
        success: true,
        valid: isValid,
        error: isValid ? null : 'Invalid Publisher ID format'
      })
    }
    
    if (action === 'save') {
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: 'Publisher ID saved (test mode)',
        publisherId: publisherId
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request'
    }, { status: 400 })
  }
}