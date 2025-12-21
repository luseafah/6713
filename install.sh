#!/bin/bash

# 6713 - One-Command Setup Script
# Installs Node.js, dependencies, and prepares the project

echo "🚀 6713 - Complete Setup"
echo "========================"
echo ""

# Check if we're in Alpine Linux (Codespaces container)
if [ -f /etc/alpine-release ]; then
    echo "📦 Installing Node.js in Alpine Linux..."
    
    # Install Node.js and npm
    apk add --no-cache nodejs npm
    
    if [ $? -eq 0 ]; then
        echo "✅ Node.js installed successfully"
        node --version
        npm --version
    else
        echo "❌ Failed to install Node.js"
        exit 1
    fi
else
    # Check if Node.js is already installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js first."
        echo "Visit: https://nodejs.org"
        exit 1
    fi
    
    echo "✅ Node.js found: $(node --version)"
    echo "✅ npm found: $(npm --version)"
fi

echo ""
echo "📦 Installing project dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔐 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY (optional)"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "========================"
echo "✅ Setup Complete!"
echo "========================"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Configure Supabase:"
echo "   - Edit .env.local with your credentials"
echo "   - Run database/schema.sql in Supabase SQL Editor"
echo ""
echo "2. Start development:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - FIXES_COMPLETE.md - All fixes applied"
echo "   - CODESANDBOX_SETUP.md - CodeSandbox deployment"
echo "   - QUICKSTART.md - Quick reference guide"
echo ""
