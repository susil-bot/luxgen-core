#!/bin/bash

# Netlify Build Script for LuxGen Backend
# This script builds the project for Netlify deployment without ESLint

echo "🚀 Starting Netlify build process..."

# Set error handling
set -e

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

# Create dist directory
echo "📁 Creating distribution directory..."
mkdir -p dist

# Copy source files
echo "📋 Copying source files..."
cp -r src dist/

# Copy Netlify configuration
echo "⚙️ Copying Netlify configuration..."
cp -r netlify dist/
cp package.json dist/
cp netlify.toml dist/

# Copy any additional required files
if [ -f "README.md" ]; then
    cp README.md dist/
fi

if [ -f "package-lock.json" ]; then
    cp package-lock.json dist/
fi

echo "✅ Netlify build completed successfully!"
echo "📁 Build output: dist/"
echo "🔧 Functions directory: dist/netlify/functions"
