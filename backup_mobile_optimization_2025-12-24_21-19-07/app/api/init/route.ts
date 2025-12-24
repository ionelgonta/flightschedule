/**
 * API Route: /api/init
 * Inițializează cache manager-ul la startup
 */

import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cacheManager';

export async function GET() {
  try {
    console.log('[Init API] Initializing cache manager...');
    await cacheManager.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Cache manager initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Init API] Error initializing cache manager:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}