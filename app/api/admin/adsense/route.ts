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
    
    return NextResponse.json({
      success: true,
      publisherId: currentPublisherId,
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
    const { publisherId, action } = await request.json()
    
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
    
    if (action === 'save') {
      // Validează Publisher ID-ul înainte de salvare
      if (!publisherId || !publisherId.startsWith('ca-pub-')) {
        return NextResponse.json({
          success: false,
          error: 'Publisher ID invalid. Trebuie să înceapă cu "ca-pub-"'
        }, { status: 400 })
      }
      
      const publisherIdRegex = /^ca-pub-\d{16}$/
      if (!publisherIdRegex.test(publisherId)) {
        return NextResponse.json({
          success: false,
          error: 'Format Publisher ID invalid. Exemplu: ca-pub-1234567890123456'
        }, { status: 400 })
      }
      
      // Citește fișierul de configurare curent
      const configPath = join(process.cwd(), 'lib', 'adConfig.ts')
      let configContent = await readFile(configPath, 'utf-8')
      
      // Înlocuiește Publisher ID-ul în fișier
      const publisherIdPattern = /(publisherId:\s*['"`])([^'"`]+)(['"`])/
      const newConfigContent = configContent.replace(
        publisherIdPattern,
        `$1${publisherId}$3`
      )
      
      // Salvează fișierul actualizat
      await writeFile(configPath, newConfigContent, 'utf-8')
      
      return NextResponse.json({
        success: true,
        message: 'Publisher ID AdSense salvat cu succes',
        publisherId: publisherId
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