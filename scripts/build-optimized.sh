#!/bin/bash

# Optimized build script for production deployment
# This script reduces build time and optimizes the output

echo "🚀 Starting optimized build process..."

# Set build environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export SKIP_ENV_VALIDATION=1

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out dist build
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo

# Optimize Node.js memory usage
export NODE_OPTIONS="--max-old-space-size=4096"

# Run type checking separately (faster than during build)
echo "🔍 Type checking..."
npx tsc --noEmit --skipLibCheck

# Build with optimizations
echo "🏗️  Building application..."
time next build

# Show build results
echo "📊 Build completed!"
echo "Build size:"
du -sh .next

echo "✅ Optimized build complete!"