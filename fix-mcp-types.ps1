# Fix TypeScript types in MCP Flight Service
$ServerIP = "23.88.113.154"
$Password = "FlightSchedule2024!"

Write-Host "Fixing TypeScript types in MCP service..." -ForegroundColor Cyan

$fixedMcpService = @'
/**
 * MCP Flight Service - Direct MCP integration using fetch API
 * Uses the working MCP endpoint for flight data
 */

export interface MCPFlightData {
  success: boolean;
  data: any[];
  error?: string;
  cached: boolean;
  last_updated: string;
  airport_code: string;
  type: 'arrivals' | 'departures';
}

class MCPFlightService {
  private apiKey: string;
  private baseUrl: string;
  private requestId: number = 1;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || 'cmj2peefi0001la04p5rkbbcc';
    this.baseUrl = 'https://prod.api.market/api/mcp/aedbx/aerodatabox';
    
    console.log('MCPFlightService: Initialized with API key:', this.apiKey.substring(0, 8) + '...');
  }

  /**
   * Initialize MCP connection
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-market-key': this.apiKey
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.requestId++,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            clientInfo: { name: "flight-schedule", version: "1.0.0" }
          }
        })
      });

      if (!response.ok) {
        console.error('MCP initialization failed:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      if (data.error) {
        console.error('MCP initialization error:', data.error);
        return false;
      }

      console.log('MCP initialized successfully');
      return true;
    } catch (error) {
      console.error('MCP initialization failed:', error);
      return false;
    }
  }

  /**
   * Get available tools
   */
  async getTools(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-market-key': this.apiKey
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.requestId++,
          method: "tools/list",
          params: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get tools: ${response.status}`);
      }

      const data = await response.json();
      return data.result?.tools || [];
    } catch (error) {
      console.error('Failed to get MCP tools:', error);
      return [];
    }
  }

  /**
   * Call MCP tool
   */
  async callTool(toolName: string, args: any): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-market-key': this.apiKey
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.requestId++,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Tool call failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`Tool error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`MCP tool call failed for ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get flights using MCP
   */
  async getFlights(airportCode: string, type: 'arrivals' | 'departures'): Promise<MCPFlightData> {
    try {
      console.log(`Getting ${type} for ${airportCode} via MCP...`);
      
      // Initialize if needed
      await this.initialize();
      
      // Get available tools
      const tools = await this.getTools();
      console.log('Available MCP tools:', tools.map((t: any) => t.name));
      
      // Find appropriate tool for flights
      const flightTool = tools.find((tool: any) => 
        tool.name.toLowerCase().includes('flight') || 
        tool.name.toLowerCase().includes('airport') ||
        tool.name.toLowerCase().includes(type)
      );

      if (!flightTool) {
        // Try with a common tool name
        const toolName = type === 'arrivals' ? 'get_arrivals' : 'get_departures';
        console.log(`No specific tool found, trying: ${toolName}`);
        
        const result = await this.callTool(toolName, {
          airport_code: airportCode,
          date: new Date().toISOString().split('T')[0]
        });
        
        return this.formatResponse(result, airportCode, type);
      }

      console.log(`Using MCP tool: ${flightTool.name}`);
      
      const result = await this.callTool(flightTool.name, {
        airport_code: airportCode,
        airport: airportCode,
        icao: airportCode,
        iata: airportCode,
        type: type,
        date: new Date().toISOString().split('T')[0],
        from: new Date().toISOString().split('T')[0] + 'T00:00',
        to: new Date().toISOString().split('T')[0] + 'T23:59'
      });

      return this.formatResponse(result, airportCode, type);
      
    } catch (error) {
      console.error(`MCP flight request failed for ${airportCode} ${type}:`, error);
      
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'MCP request failed',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };
    }
  }

  /**
   * Format MCP response to standard format
   */
  private formatResponse(result: any, airportCode: string, type: 'arrivals' | 'departures'): MCPFlightData {
    try {
      // Handle different response formats
      let flights: any[] = [];
      
      if (result && result.content) {
        // MCP tool response format
        if (Array.isArray(result.content)) {
          flights = result.content;
        } else if (result.content.text) {
          // Try to parse JSON from text content
          try {
            const parsed = JSON.parse(result.content.text);
            flights = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            flights = [];
          }
        }
      } else if (Array.isArray(result)) {
        flights = result;
      } else if (result && typeof result === 'object') {
        flights = [result];
      }

      // Convert to standard format with proper typing
      const standardFlights = flights.map((flight: any) => ({
        flight_number: flight.flight_number || flight.number || flight.callsign || 'N/A',
        airline: {
          name: flight.airline?.name || flight.carrier || 'Unknown',
          code: flight.airline?.code || flight.airline_code || 'XX'
        },
        origin: {
          airport: flight.origin?.airport || flight.departure?.airport || 'Unknown',
          code: flight.origin?.code || flight.departure?.code || 'XXX',
          city: flight.origin?.city || flight.departure?.city || 'Unknown'
        },
        destination: {
          airport: flight.destination?.airport || flight.arrival?.airport || 'Unknown',
          code: flight.destination?.code || flight.arrival?.code || 'XXX',
          city: flight.destination?.city || flight.arrival?.city || 'Unknown'
        },
        scheduled_time: flight.scheduled_time || flight.scheduled || new Date().toISOString(),
        estimated_time: flight.estimated_time || flight.estimated,
        actual_time: flight.actual_time || flight.actual,
        status: flight.status || 'unknown',
        gate: flight.gate,
        terminal: flight.terminal,
        aircraft: flight.aircraft
      }));

      return {
        success: true,
        data: standardFlights,
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };
      
    } catch (error) {
      console.error('Error formatting MCP response:', error);
      
      return {
        success: false,
        data: [],
        error: 'Failed to format response',
        cached: false,
        last_updated: new Date().toISOString(),
        airport_code: airportCode,
        type: type
      };
    }
  }
}

// Singleton instance
let mcpFlightServiceInstance: MCPFlightService | null = null;

export function getMCPFlightService(): MCPFlightService {
  if (!mcpFlightServiceInstance) {
    mcpFlightServiceInstance = new MCPFlightService();
  }
  return mcpFlightServiceInstance;
}

export default MCPFlightService;
'@

# Save the fixed MCP service
$fixedMcpService | Out-File -FilePath "mcpFlightService-fixed.ts" -Encoding UTF8

# Upload to server
Write-Host "Uploading fixed MCP service..." -ForegroundColor Yellow
pscp -pw $Password "mcpFlightService-fixed.ts" root@${ServerIP}:/tmp/

# Apply fix
Write-Host "Applying TypeScript fix..." -ForegroundColor Yellow
$updateCmd = "plink -ssh -pw $Password root@$ServerIP `"cd /opt/anyway-flight-schedule && cp /tmp/mcpFlightService-fixed.ts lib/mcpFlightService.ts`""
Invoke-Expression $updateCmd

# Clean up
Remove-Item "mcpFlightService-fixed.ts" -ErrorAction SilentlyContinue

Write-Host "TypeScript fix applied. Rebuilding..." -ForegroundColor Green