#!/usr/bin/env node

/**
 * SCRIPT DE URGENȚĂ - Oprește vechiul cache manager care cauzează 10,000 requesturi/oră
 */

const fs = require('fs').promises;
const path = require('path');

async function emergencyStopOldCache() {
  console.log('🚨 OPRIRE DE URGENȚĂ - Vechiul Cache Manager');
  console.log('');
  
  // 1. Dezactivează complet vechiul cache manager
  const oldCacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManager.ts');
  
  try {
    let content = await fs.readFile(oldCacheManagerPath, 'utf-8');
    
    // Comentează complet auto-inițializarea
    content = content.replace(
      /\/\/ Auto-initialize on server startup[\s\S]*?}\s*$/, 
      `// DISABLED: Auto-initialize completely disabled to prevent API overload
// This old cache manager was causing 10,000+ API requests per hour
// Use fixedCacheManager instead

/*
// Auto-initialize on server startup
if (typeof window === 'undefined') {
  setTimeout(async () => {
    try {
      console.log('[Fixed Cache Manager] Starting auto-initialization...')
      await fixedCacheManager.initialize()
      console.log('[Fixed Cache Manager] Auto-initialization completed')
    } catch (error) {
      console.error('[Fixed Cache Manager] Auto-initialization failed:', error)
    }
  }, 1000)
}
*/`
    );
    
    await fs.writeFile(oldCacheManagerPath, content);
    console.log('✅ Dezactivat complet vechiul cache manager');
    
  } catch (error) {
    console.error('❌ Eroare la dezactivarea vechiului cache manager:', error.message);
  }
  
  // 2. Verifică că fixedCacheManager este activ
  const fixedCacheManagerPath = path.join(process.cwd(), 'lib', 'cacheManagerFixed.ts');
  
  try {
    const content = await fs.readFile(fixedCacheManagerPath, 'utf-8');
    
    if (content.includes('setTimeout(async () => {')) {
      console.log('✅ Fixed Cache Manager este activ');
    } else {
      console.log('⚠️  Fixed Cache Manager nu pare să fie auto-inițializat');
    }
    
  } catch (error) {
    console.error('❌ Eroare la verificarea fixed cache manager:', error.message);
  }
  
  console.log('');
  console.log('🔄 RESTART NECESAR:');
  console.log('ssh root@anyway.ro "pm2 restart anyway-ro"');
  console.log('');
  console.log('📊 REZULTAT AȘTEPTAT:');
  console.log('- Requesturi/oră: de la ~10,000 la ~35');
  console.log('- Interval flight data: 60 minute (în loc de 10)');
  console.log('- Doar Fixed Cache Manager activ');
}

emergencyStopOldCache().catch(console.error);