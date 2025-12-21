#!/bin/bash

# CodeSandbox & Supabase Setup Verification Script

echo "🔍 Verifying 6713 Setup for CodeSandbox & Supabase..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

echo "✅ Project directory confirmed"

# Check configuration files
CONFIG_FILES=(
    "sandbox.config.json"
    ".codesandbox/tasks.json"
    "next.config.js"
    ".env.example"
    "lib/supabase.ts"
    "types/database.ts"
)

echo ""
echo "📁 Checking configuration files..."
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

# Check environment variables
echo ""
echo "🔐 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "  ✅ NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo "  ⚠️  NEXT_PUBLIC_SUPABASE_URL not found"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo "  ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not found"
    fi
else
    echo "  ⚠️  .env.local not found (copy from .env.example)"
fi

# Check if node_modules exists
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules directory exists"
    
    if [ -d "node_modules/@supabase" ]; then
        echo "  ✅ Supabase packages installed"
    else
        echo "  ⚠️  Supabase packages not found - run 'npm install'"
    fi
else
    echo "  ⚠️  node_modules not found - run 'npm install'"
fi

# Check critical app directories
echo ""
echo "📂 Checking app structure..."
APP_DIRS=(
    "app"
    "components"
    "lib"
    "types"
    "supabase"
)

for dir in "${APP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ (missing)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Setup Summary:"
echo ""

# Overall status
MISSING_FILES=0
for file in "${CONFIG_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ((MISSING_FILES++))
    fi
done

if [ $MISSING_FILES -eq 0 ] && [ -f ".env.local" ] && [ -d "node_modules" ]; then
    echo "✅ Your project is ready for CodeSandbox!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Push to GitHub"
    echo "   2. Import to CodeSandbox"
    echo "   3. Add Secrets in CodeSandbox"
    echo "   4. Run 'npm run dev'"
elif [ ! -f ".env.local" ]; then
    echo "⚠️  Almost ready! Create .env.local with your Supabase credentials"
    echo ""
    echo "📝 Copy .env.example to .env.local and add your credentials:"
    echo "   cp .env.example .env.local"
elif [ ! -d "node_modules" ]; then
    echo "⚠️  Almost ready! Install dependencies:"
    echo "   npm install"
else
    echo "⚠️  Some files are missing. Check the list above."
fi

echo ""
echo "📚 Documentation:"
echo "   - CODESANDBOX_SETUP.md"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo "   - README.md"
echo ""
