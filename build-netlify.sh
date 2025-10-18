#!/bin/bash

# Netlify Build Script for LuxGen Backend
# This script handles the subdirectory structure properly

echo "🏗️ Building LuxGen Backend for Netlify..."

# Check if luxgen-backend directory exists
if [ ! -d "luxgen-backend" ]; then
    echo "❌ Error: luxgen-backend directory not found!"
    echo "Current directory contents:"
    ls -la
    exit 1
fi

echo "✅ Found luxgen-backend directory"

# Navigate to backend directory
cd luxgen-backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in luxgen-backend directory!"
    exit 1
fi

echo "✅ Found package.json"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run the minimal build
echo "🏗️ Running minimal build..."
npm run build:netlify

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output:"
    ls -la dist/
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Netlify build completed successfully!"
