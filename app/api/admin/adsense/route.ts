import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

// API endpoint pentru gestionarea configurației AdSense
export async function GET() {
  try {
    // Citește configurația curentă din fișierul adConfig.ts
    const configPath = join(process.cwd(), 'lib', 'adConfig.ts')
    const configContent = await readFile(configPath, 'utf-8')
    
    // Extrage Publisher ID-ul curent
    const publisherIdMatch = configContent.match(/publisherId:\s*['"`]([^'"`]+)['"`]/)
    const currentPublisherId = publisherIdMatch ? publisherIdMatch[1] : ''
    
    // Extrage configurația zonelor cu un regex mai robust
    const zonesMatch = configContent.match(/zones:\s*{([\s\S]*?)}\s*}/m)
    let zones: any = {}
    
    if (zonesMatch) {
      // Parse zone configurations cu un regex mai complex pentru nested objects
      const zoneContent = zonesMatch[1]
      const zoneMatches = zoneContent.matchAll(/'([^']+)':\s*{([^}]*(?:{[^}]*}[^}]*)*)}/g)
      
      for (const match of zoneMatches) {
        const zoneName = match[1]
        const zoneConfig = match[2]
        
        const modeMatch = zoneConfig.match(/mode:\s*['"`]([^'"`]+)['"`]/)
        const slotIdMatch = zoneConfig.match(/slotId:\s*['"`]([^'"`]*)['"`]/)
        const sizeMatch = zoneConfig.match(/size:\s*['"`]([^'"`]+)['"`]/)
        const customHtmlMatch = zoneConfig.match(/customHtml:\s*(?:['"`]([^'"`]*)['"`]|undefined)/)
        
        zones[zoneName] = {
          mode: modeMatch ? modeMatch[1] : 'inactive',
          slotId: slotIdMatch ? slotIdMatch[1] : '',
          size: sizeMatch ? sizeMatch[1] : '300x250',
          customHtml: customHtmlMatch && customHtmlMatch[1] ? customHtmlMatch[1] : undefined
        }
      }
    }
    
    // Dacă nu s-au găsit zone prin parsing, returnează configurația default
    if (Object.keys(zones).length === 0) {
      zones = {
        'header-banner': { mode: 'active', slotId: '1234567890', size: '728x90' },
        'sidebar-right': { mode: 'active', slotId: '1234567891', size: '300x600' },
        'sidebar-square': { mode: 'active', slotId: '1234567892', size: '300x250' },
        'inline-banner': { mode: 'active', slotId: '1234567893', size: '728x90' },
        'footer-banner': { mode: 'active', slotId: '1234567894', size: '970x90' },
        'mobile-banner': { mode: 'active', slotId: '1234567895', size: '320x50' },
        'partner-banner-1': { mode: 'inactive', slotId: '', size: '728x90', customHtml: undefined },
        'partner-banner-2': { mode: 'inactive', slotId: '', size: '300x250', customHtml: undefined }
      }
    }
    
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
        // Actualizează configurația zonelor
        for (const [zoneName, zoneConfig] of Object.entries(config.zones)) {
          const zone = zoneConfig as any
          
          // Actualizează mode
          const modePattern = new RegExp(`('${zoneName}':\\s*{[^}]*mode:\\s*['"\`])([^'"\`]+)(['"\`])`)
          configContent = configContent.replace(modePattern, `$1${zone.mode}$3`)
          
          // Actualizează slotId
          const slotIdPattern = new RegExp(`('${zoneName}':\\s*{[^}]*slotId:\\s*['"\`])([^'"\`]*)(['"\`])`)
          configContent = configContent.replace(slotIdPattern, `$1${zone.slotId || ''}$3`)
          
          // Actualizează customHtml pentru zone partner
          if (zoneName.includes('partner') && zone.customHtml !== undefined) {
            const customHtmlPattern = new RegExp(`('${zoneName}':[^}]*customHtml:\\s*)([^,}]+)`)
            const newValue = zone.customHtml ? `'${zone.customHtml.replace(/'/g, "\\'")}'` : 'undefined'
            configContent = configContent.replace(customHtmlPattern, `$1${newValue}`)
          }
        }
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