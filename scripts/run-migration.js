/**
 * Simple migration runner script
 * Runs the persistent cache migration with proper error handling
 */

const { runMigration } = require('./migrate-persistent-cache.ts')

console.log('🚀 Starting Persistent Cache Migration...')
console.log('📋 Following strict IATA airport mapping rules')
console.log('🔒 Preserving all existing historical data')
console.log('❌ Rejecting any mock/demo/test data')

runMigration()
  .then(() => {
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })