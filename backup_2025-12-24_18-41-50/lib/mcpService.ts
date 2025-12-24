/**
 * MCP Service - Model Context Protocol integration pentru API.Market AeroDataBox
 * Folosește cURL pentru comunicarea cu MCP endpoint-ul
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MCPConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

class MCPService {
  private config: MCPConfig;
  private requestId: number = 1;
  private initialized: boolean = false;
  private availableTools: MCPTool[] = [];

  constructor(config: MCPConfig) {
    this.config = config;
  }

  /**
   * Inițializează conexiunea MCP
   */
  async initialize(): Promise<boolean> {
    try {
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: "anyway-flight-schedule",
            version: "1.0.0"
          }
        }
      };

      const response = await this.makeRequest(request);
      
      if (response.error) {
        console.error('MCP initialization failed:', response.error);
        return false;
      }

      this.initialized = true;
      console.log('MCP initialized successfully');
      
      // Încarcă lista de tools disponibile
      await this.loadAvailableTools();
      
      return true;
    } catch (error) {
      console.error('MCP initialization error:', error);
      return false;
    }
  }

  /**
   * Încarcă lista de tools disponibile
   */
  async loadAvailableTools(): Promise<MCPTool[]> {
    try {
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/list",
        params: {}
      };

      const response = await this.makeRequest(request);
      
      if (response.error) {
        console.error('Failed to load tools:', response.error);
        return [];
      }

      this.availableTools = response.result?.tools || [];
      console.log(`Loaded ${this.availableTools.length} MCP tools`);
      
      return this.availableTools;
    } catch (error) {
      console.error('Error loading tools:', error);
      return [];
    }
  }

  /**
   * Obține lista de tools disponibile
   */
  getAvailableTools(): MCPTool[] {
    return this.availableTools;
  }

  /**
   * Apelează un tool MCP specific
   */
  async callTool(toolName: string, toolArguments: Record<string, any>): Promise<any> {
    if (!this.initialized) {
      throw new Error('MCP service not initialized. Call initialize() first.');
    }

    try {
      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: toolArguments
        }
      };

      const response = await this.makeRequest(request);
      
      if (response.error) {
        throw new Error(`MCP tool call failed: ${response.error.message}`);
      }

      return response.result;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Obține zborurile pentru un aeroport folosind MCP
   */
  async getFlightsMCP(airportCode: string, type: 'arrivals' | 'departures'): Promise<any> {
    try {
      // Verifică dacă tool-ul pentru flights este disponibil
      const flightTool = this.availableTools.find(tool => 
        tool.name.includes('flight') || tool.name.includes('airport')
      );

      if (!flightTool) {
        throw new Error('No flight tool available in MCP');
      }

      const today = new Date().toISOString().split('T')[0];
      
      const result = await this.callTool(flightTool.name, {
        airport: airportCode,
        type: type,
        date: today,
        timeFrom: `${today}T00:00`,
        timeTo: `${today}T23:59`
      });

      return result;
    } catch (error) {
      console.error(`MCP flight request failed for ${airportCode}:`, error);
      throw error;
    }
  }

  /**
   * Caută aeroporturi folosind MCP
   */
  async searchAirportsMCP(query: string): Promise<any> {
    try {
      const searchTool = this.availableTools.find(tool => 
        tool.name.includes('search') || tool.name.includes('airport')
      );

      if (!searchTool) {
        throw new Error('No airport search tool available in MCP');
      }

      const result = await this.callTool(searchTool.name, {
        query: query,
        limit: 10
      });

      return result;
    } catch (error) {
      console.error(`MCP airport search failed for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Face un request MCP folosind cURL
   */
  private async makeRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const curlCommand = this.buildCurlCommand(request);
      const { stdout, stderr } = await execAsync(curlCommand);

      if (stderr && !stderr.includes('progress')) {
        console.warn('cURL stderr:', stderr);
      }

      const response = JSON.parse(stdout);
      return response;
    } catch (error) {
      console.error('MCP request failed:', error);
      throw new Error(`MCP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Construiește comanda cURL pentru request-ul MCP
   */
  private buildCurlCommand(request: MCPRequest): string {
    const requestBody = JSON.stringify(request);
    const escapedBody = requestBody.replace(/'/g, "'\"'\"'");

    return `curl -s -X POST "${this.config.baseUrl}" ` +
           `-H "Content-Type: application/json" ` +
           `-H "x-api-market-key: ${this.config.apiKey}" ` +
           `--connect-timeout ${this.config.timeout} ` +
           `--max-time ${this.config.timeout * 2} ` +
           `-d '${escapedBody}'`;
  }

  /**
   * Verifică dacă serviciul MCP este inițializat
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Resetează serviciul MCP
   */
  reset(): void {
    this.initialized = false;
    this.availableTools = [];
    this.requestId = 1;
  }
}

// Configurația MCP pentru API.Market AeroDataBox
export const MCP_CONFIG: MCPConfig = {
  apiKey: process.env.NEXT_PUBLIC_FLIGHT_API_KEY || '',
  baseUrl: 'https://prod.api.market/api/mcp/aedbx/aerodatabox',
  timeout: 30 // secunde
};

// Instanța globală MCP service
let mcpServiceInstance: MCPService | null = null;

/**
 * Obține instanța MCP service (singleton)
 */
export function getMCPService(): MCPService {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new MCPService(MCP_CONFIG);
  }
  return mcpServiceInstance;
}

/**
 * Inițializează serviciul MCP dacă nu este deja inițializat
 */
export async function ensureMCPInitialized(): Promise<MCPService> {
  const service = getMCPService();
  
  if (!service.isInitialized()) {
    const success = await service.initialize();
    if (!success) {
      throw new Error('Failed to initialize MCP service');
    }
  }
  
  return service;
}

export default MCPService;