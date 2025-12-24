/**
 * API Route: /api/admin/api-key
 * Gestionează API key-ul pentru AeroDataBox
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const ENV_FILE_PATH = join(process.cwd(), '.env.local');

// Funcție pentru a testa API key-ul
async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Test cu MCP endpoint care funcționează
    const testUrl = 'https://prod.api.market/api/mcp/aedbx/aerodatabox';
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'x-api-market-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
          "protocolVersion": "2024-11-05",
          "capabilities": {"tools": {}},
          "clientInfo": {"name": "admin-panel", "version": "1.0.0"}
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Verifică dacă răspunsul MCP este valid
      if (data.jsonrpc === "2.0" && data.result) {
        return { valid: true };
      } else {
        return { valid: false, error: 'Răspuns MCP invalid' };
      }
    } else if (response.status === 401) {
      return { valid: false, error: 'API key invalid sau expirat' };
    } else if (response.status === 403) {
      return { valid: false, error: 'API key nu are permisiuni pentru MCP' };
    } else if (response.status === 404) {
      return { valid: false, error: 'Endpoint MCP nu a fost găsit' };
    } else {
      return { valid: false, error: `Eroare API: ${response.status} ${response.statusText}` };
    }
  } catch (error) {
    return { valid: false, error: 'Eroare de conexiune la API' };
  }
}

// Funcție pentru a actualiza .env.local
async function updateEnvFile(newApiKey: string): Promise<void> {
  try {
    let envContent = '';
    
    // Încearcă să citească fișierul existent
    try {
      envContent = await readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error) {
      // Fișierul nu există, va fi creat
    }

    // Actualizează sau adaugă API key-ul
    const lines = envContent.split('\n');
    let keyUpdated = false;

    const updatedLines = lines.map(line => {
      if (line.startsWith('NEXT_PUBLIC_FLIGHT_API_KEY=')) {
        keyUpdated = true;
        return `NEXT_PUBLIC_FLIGHT_API_KEY=${newApiKey}`;
      }
      return line;
    });

    // Dacă key-ul nu a fost găsit, adaugă-l
    if (!keyUpdated) {
      updatedLines.push(`NEXT_PUBLIC_FLIGHT_API_KEY=${newApiKey}`);
    }

    // Scrie fișierul actualizat
    await writeFile(ENV_FILE_PATH, updatedLines.join('\n'));
  } catch (error) {
    throw new Error('Nu s-a putut actualiza fișierul de configurare');
  }
}

// GET - Obține API key-ul curent
export async function GET() {
  try {
    const currentKey = process.env.NEXT_PUBLIC_FLIGHT_API_KEY || '';
    
    return NextResponse.json({
      success: true,
      apiKey: currentKey ? `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 8)}` : '',
      hasKey: !!currentKey
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Eroare la citirea API key-ului' },
      { status: 500 }
    );
  }
}

// POST - Testează și salvează API key-ul
export async function POST(request: NextRequest) {
  try {
    const { apiKey, action } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'API key este necesar' },
        { status: 400 }
      );
    }

    // Testează API key-ul
    const testResult = await testApiKey(apiKey);

    if (action === 'test') {
      // Doar testează, nu salva
      return NextResponse.json({
        success: true,
        valid: testResult.valid,
        error: testResult.error
      });
    }

    if (action === 'save') {
      // Testează și salvează dacă este valid
      if (!testResult.valid) {
        return NextResponse.json({
          success: false,
          error: testResult.error || 'API key invalid'
        }, { status: 400 });
      }

      // Salvează API key-ul în .env.local
      await updateEnvFile(apiKey);

      return NextResponse.json({
        success: true,
        message: 'API key salvat cu succes',
        valid: true
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acțiune necunoscută' },
      { status: 400 }
    );

  } catch (error) {
    console.error('API Key management error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}

// DELETE - Șterge API key-ul
export async function DELETE() {
  try {
    await updateEnvFile('');
    
    return NextResponse.json({
      success: true,
      message: 'API key șters cu succes'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Eroare la ștergerea API key-ului' },
      { status: 500 }
    );
  }
}