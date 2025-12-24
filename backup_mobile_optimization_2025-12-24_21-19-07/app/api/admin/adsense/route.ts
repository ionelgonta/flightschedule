import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

// Import the current config to get default values
import { adConfig as defaultAdConfig } from '@/lib/adConfig'

// API endpoint pentru gestionarea configurației AdSense
export async function GET() {
  try {
    // Citește configurația curentă din fișierul adConfig.ts
    const configPath = join(process.cwd(), 'lib', 'adConfig.ts')
    const configContent = await readFile(configPath, 'utf-8')
    
    // Extrage Publisher ID-ul curent
    const publisherIdMatch = configContent.match(/publisherId:\s*['"`]([^'"`]+)['"`]/)
    const currentPublisherId = publisherIdMatch ? publisherIdMatch[1] : ''
    
    // Use the imported config as the source of truth for zones
    const zones = defaultAdConfig.zones
    
    return NextResponse.json({
      success: true,
      publisherId: currentPublisherId,
      zones: zones,
      hasPublisherId: !!currentPublisherId
    })
  } catch (error) {
    console.error('Error reading AdSense config:', error)
    return NextResponse.json({
      success: false,
      error: 'Eroare la citirea configurației AdSense'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publisherId, action, config } = body
    
    if (action === 'test') {
      // Testează validitatea Publisher ID-ului
      if (!publisherId || !publisherId.startsWith('ca-pub-')) {
        return NextResponse.json({
          success: false,
          valid: false,
          error: 'Publisher ID invalid. Trebuie să înceapă cu "ca-pub-"'
        })
      }
      
      // Verifică formatul Publisher ID-ului
      const publisherIdRegex = /^ca-pub-\d{16}$/
      const isValid = publisherIdRegex.test(publisherId)
      
      return NextResponse.json({
        success: true,
        valid: isValid,
        error: isValid ? null : 'Format Publisher ID invalid. Exemplu: ca-pub-1234567890123456'
      })
    }
    
    if (action === 'save' || action === 'update') {
      const publisherIdToSave = config?.publisherId || publisherId
      
      // Validează Publisher ID-ul înainte de salvare
      if (!publisherIdToSave) {
        return NextResponse.json({
          success: false,
          error: 'Publisher ID lipsește'
        }, { status: 400 })
      }
      
      if (!publisherIdToSave.startsWith('ca-pub-')) {
        return NextResponse.json({
          success: false,
          error: 'Publisher ID invalid. Trebuie să înceapă cu "ca-pub-"'
        }, { status: 400 })
      }
      
      // Relaxed validation - accept any ca-pub- format
      const publisherIdRegex = /^ca-pub-\d+$/
      if (!publisherIdRegex.test(publisherIdToSave)) {
        return NextResponse.json({
          success: false,
          error: 'Format Publisher ID invalid. Trebuie să conțină doar cifre după "ca-pub-"'
        }, { status: 400 })
      }
      
      // Citește fișierul de configurare curent
      const configPath = join(process.cwd(), 'lib', 'adConfig.ts')
      let configContent = await readFile(configPath, 'utf-8')
      
      // Înlocuiește Publisher ID-ul în fișier
      const publisherIdPattern = /(publisherId:\s*['"`])([^'"`]+)(['"`])/
      configContent = configContent.replace(
        publisherIdPattern,
        `$1${publisherIdToSave}$3`
      )
      
      // Dacă avem configurația completă, actualizează și zonele
      if (config && config.zones) {
        // Reconstruiește întreaga secțiune zones pentru a evita problemele de regex
        let zonesContent = '  zones: {\n'
        
        for (const [zoneName, zoneConfig] of Object.entries(config.zones)) {
          const zone = zoneConfig as any
          zonesContent += `    '${zoneName}': {\n`
          zonesContent += `      mode: '${zone.mode}',\n`
          zonesContent += `      slotId: '${zone.slotId || ''}',\n`
          zonesContent += `      size: '${zone.size}',\n`
          
          if (zoneName.includes('partner')) {
            if (zone.customHtml && zone.customHtml.trim()) {
              const escapedHtml = zone.customHtml.replace(/'/g, "\\'").replace(/\n/g, '\\n')
              zonesContent += `      customHtml: '${escapedHtml}'\n`
            } else {
              zonesContent += `      customHtml: undefined\n`
            }
          } else {
            zonesContent += `      customHtml: undefined\n`
          }
          
          zonesContent += `    },\n`
        }
        
        zonesContent += '  }\n'
        
        // Înlocuiește întreaga secțiune zones
        const zonesPattern = /zones:\s*{[\s\S]*?}\s*}/
        configContent = configContent.replace(zonesPattern, zonesContent.trim())
      }
      
      // Salvează fișierul actualizat
      await writeFile(configPath, configContent, 'utf-8')
      
      return NextResponse.json({
        success: true,
        message: 'Configurația AdSense a fost salvată cu succes',
        publisherId: publisherIdToSave
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Acțiune necunoscută'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Error managing AdSense config:', error)
    return NextResponse.json({
      success: false,
      error: 'Eroare la gestionarea configurației AdSense'
    }, { status: 500 })
  }
}