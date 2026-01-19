/**
 * Persistent API Request Tracker - Server-side only
 * Tracks API usage and rate limiting
 */

import fs from 'fs';
import path from 'path';

interface ApiRequestLog {
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  source: string;
}

interface ApiStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerHour: number;
  lastRequest: string;
}

class PersistentApiRequestTracker {
  private logFile: string;
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.logFile = path.join(this.dataDir, 'api-requests.log');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Log an API request
   */
  logRequest(endpoint: string, method: string, status: number, responseTime: number, source: string = 'unknown'): void {
    const logEntry: ApiRequestLog = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      status,
      responseTime,
      source
    };

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to log API request:', error);
    }
  }

  /**
   * Get API statistics
   */
  getStats(): ApiStats {
    try {
      if (!fs.existsSync(this.logFile)) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          requestsPerHour: 0,
          lastRequest: 'Never'
        };
      }

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.length > 0);
      
      if (lines.length === 0) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          requestsPerHour: 0,
          lastRequest: 'Never'
        };
      }

      const requests: ApiRequestLog[] = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(req => req !== null);

      const totalRequests = requests.length;
      const successfulRequests = requests.filter(req => req.status >= 200 && req.status < 300).length;
      const failedRequests = totalRequests - successfulRequests;
      
      const totalResponseTime = requests.reduce((sum, req) => sum + req.responseTime, 0);
      const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

      // Calculate requests per hour for the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRequests = requests.filter(req => new Date(req.timestamp) > oneDayAgo);
      const requestsPerHour = recentRequests.length / 24;

      const lastRequest = requests.length > 0 ? requests[requests.length - 1].timestamp : 'Never';

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(averageResponseTime),
        requestsPerHour: Math.round(requestsPerHour * 10) / 10,
        lastRequest
      };
    } catch (error) {
      console.error('Failed to get API stats:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        requestsPerHour: 0,
        lastRequest: 'Error reading logs'
      };
    }
  }

  /**
   * Clear old logs (keep only last 30 days)
   */
  cleanupOldLogs(): void {
    try {
      if (!fs.existsSync(this.logFile)) {
        return;
      }

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.length > 0);
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentLines = lines.filter(line => {
        try {
          const request = JSON.parse(line);
          return new Date(request.timestamp) > thirtyDaysAgo;
        } catch {
          return false;
        }
      });

      if (recentLines.length < lines.length) {
        fs.writeFileSync(this.logFile, recentLines.join('\n') + '\n');
        console.log(`Cleaned up ${lines.length - recentLines.length} old API log entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Get detailed statistics including breakdown by type and airport
   */
  getDetailedStats(): { stats: ApiStats; byType: Record<string, number>; byAirport: Record<string, number>; recentRequests: ApiRequestLog[] } {
    try {
      const stats = this.getStats();
      const requests = this.getAllRequests();
      
      // Group by type (endpoint pattern)
      const byType: Record<string, number> = {};
      const byAirport: Record<string, number> = {};
      
      requests.forEach(req => {
        // Extract type from endpoint
        const type = req.source || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
        
        // Extract airport code from endpoint if present
        const airportMatch = req.endpoint.match(/\/([A-Z]{3})\//i);
        if (airportMatch) {
          const airport = airportMatch[1].toUpperCase();
          byAirport[airport] = (byAirport[airport] || 0) + 1;
        }
      });
      
      // Get last 20 requests
      const recentRequests = requests.slice(-20).reverse();
      
      return {
        stats,
        byType,
        byAirport,
        recentRequests
      };
    } catch (error) {
      console.error('Failed to get detailed stats:', error);
      return {
        stats: this.getStats(),
        byType: {},
        byAirport: {},
        recentRequests: []
      };
    }
  }

  /**
   * Get recent requests
   */
  getRecentRequests(limit: number = 50): ApiRequestLog[] {
    try {
      const requests = this.getAllRequests();
      return requests.slice(-limit).reverse();
    } catch (error) {
      console.error('Failed to get recent requests:', error);
      return [];
    }
  }

  /**
   * Get requests by airport code
   */
  getRequestsByAirport(airportCode: string): ApiRequestLog[] {
    try {
      const requests = this.getAllRequests();
      return requests.filter(req => 
        req.endpoint.toUpperCase().includes(airportCode.toUpperCase())
      );
    } catch (error) {
      console.error('Failed to get requests by airport:', error);
      return [];
    }
  }

  /**
   * Get requests by type
   */
  getRequestsByType(requestType: string): ApiRequestLog[] {
    try {
      const requests = this.getAllRequests();
      return requests.filter(req => req.source === requestType);
    } catch (error) {
      console.error('Failed to get requests by type:', error);
      return [];
    }
  }

  /**
   * Reset the request counter (clear log file)
   */
  resetCounter(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, '');
        console.log('API request counter reset');
      }
    } catch (error) {
      console.error('Failed to reset counter:', error);
    }
  }

  /**
   * Get all requests from log file
   */
  private getAllRequests(): ApiRequestLog[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.length > 0);
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(req => req !== null) as ApiRequestLog[];
    } catch (error) {
      console.error('Failed to get all requests:', error);
      return [];
    }
  }
}

// Singleton instance
export const persistentApiRequestTracker = new PersistentApiRequestTracker();