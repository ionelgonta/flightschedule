import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyScheduleAnalyzer } from '@/lib/weeklyScheduleAnalyzer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'get'
    const format = searchParams.get('format') as 'json' | 'csv' | null
    
    const analyzer = getWeeklyScheduleAnalyzer()
    
    switch (action) {
      case 'get':
        const scheduleData = await analyzer.getScheduleData()
        
        // Calculate data range from schedule data
        let dataRange = null
        if (scheduleData.length > 0) {
          const dates = scheduleData.map(item => new Date(item.lastUpdated))
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
          
          // Estimate data range (assuming 3 months back from latest update)
          const estimatedStart = new Date(maxDate)
          estimatedStart.setMonth(estimatedStart.getMonth() - 3)
          
          dataRange = {
            from: estimatedStart.toISOString(),
            to: maxDate.toISOString()
          }
        }
        
        return NextResponse.json({
          success: true,
          data: scheduleData,
          count: scheduleData.length,
          dataRange
        })
      
      case 'analyze':
        const analysis = await analyzer.analyzeFlightPatterns()
        return NextResponse.json({
          success: true,
          analysis
        })
      
      case 'export':
        if (!format) {
          return NextResponse.json({
            success: false,
            error: 'Format parameter required for export'
          }, { status: 400 })
        }
        
        const exportData = await analyzer.exportSchedule(format)
        
        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="weekly-schedule.csv"'
            }
          })
        }
        
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="weekly-schedule.json"'
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Weekly schedule API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    const analyzer = getWeeklyScheduleAnalyzer()
    
    switch (action) {
      case 'update':
        await analyzer.updateScheduleTable()
        return NextResponse.json({
          success: true,
          message: 'Weekly schedule table updated successfully'
        })
      
      case 'clear':
        await analyzer.clearScheduleTable()
        return NextResponse.json({
          success: true,
          message: 'Weekly schedule table cleared successfully'
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Weekly schedule POST API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}