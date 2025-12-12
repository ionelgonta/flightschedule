/**
 * API Route: /api/mcp/flights
 * Endpoint pentru testarea și utilizarea MCP integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPService, ensureMCPInitialized } from '@/lib/mcpService';

// GET - Testează conexiunea MCP și listează tools disponibile
export async function GET() {
  try {
    const mcpService = await ensureMCPInitialized();
    const tools = mcpService.getAvailableTools();

    return NextResponse.json({
      success: true,
      initialized: mcpService.isInitialized(),
      toolsCount: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
  } catch (error) {
    console.error('MCP GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MCP error',
      initialized: false,
      toolsCount: 0,
      tools: []
    }, { status: 500 });
  }
}

// POST - Apelează un tool MCP specific
export async function POST(request: NextRequest) {
  try {
    const { toolName, arguments: toolArgs, airport, type } = await request.json();

    if (!toolName) {
      return NextResponse.json({
        success: false,
        error: 'Tool name is required'
      }, { status: 400 });
    }

    const mcpService = await ensureMCPInitialized();

    let result;
    
    // Dacă este cerere pentru flights, folosește metoda specializată
    if (airport && type && (type === 'arrivals' || type === 'departures')) {
      result = await mcpService.getFlightsMCP(airport, type);
    } 
    // Altfel, apelează tool-ul direct cu argumentele furnizate
    else {
      result = await mcpService.callTool(toolName, toolArgs || {});
    }

    return NextResponse.json({
      success: true,
      toolName,
      arguments: toolArgs,
      result
    });

  } catch (error) {
    console.error('MCP POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MCP error'
    }, { status: 500 });
  }
}

// PUT - Reinițializează conexiunea MCP
export async function PUT() {
  try {
    const mcpService = getMCPService();
    mcpService.reset();
    
    const success = await mcpService.initialize();
    
    if (success) {
      const tools = mcpService.getAvailableTools();
      
      return NextResponse.json({
        success: true,
        message: 'MCP service reinitialized successfully',
        toolsCount: tools.length
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to reinitialize MCP service'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('MCP PUT error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MCP error'
    }, { status: 500 });
  }
}