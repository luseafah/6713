#!/bin/bash

echo "🔍 6713 Wall - Installation Verification"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        return 1
    fi
}

echo "📦 Core Configuration Files:"
check_file "package.json"
check_file "tsconfig.json"
check_file "next.config.js"
check_file "tailwind.config.ts"
check_file "postcss.config.js"
check_file ".env.local.example"
echo ""

echo "📁 Directory Structure:"
check_dir "app"
check_dir "app/api"
check_dir "app/api/wall"
check_dir "app/api/coma"
check_dir "components"
check_dir "database"
check_dir "lib"
check_dir "types"
echo ""

echo "🧱 Wall Components:"
check_file "components/Wall.tsx"
check_file "components/Navigation.tsx"
check_file "components/ComaModal.tsx"
check_file "components/ComaSettings.tsx"
echo ""

echo "🔌 API Routes:"
check_file "app/api/wall/messages/route.ts"
check_file "app/api/wall/reactions/route.ts"
check_file "app/api/wall/cooldown/route.ts"
check_file "app/api/coma/enter/route.ts"
check_file "app/api/coma/exit/route.ts"
check_file "app/api/coma/status/route.ts"
check_file "app/api/profile/route.ts"
echo ""

echo "📄 Pages:"
check_file "app/page.tsx"
check_file "app/layout.tsx"
check_file "app/wall/page.tsx"
check_file "app/settings/page.tsx"
check_file "app/hue/page.tsx"
check_file "app/live/page.tsx"
check_file "app/money/page.tsx"
echo ""

echo "🗄️ Database & Types:"
check_file "database/schema.sql"
check_file "types/database.ts"
check_file "lib/supabase.ts"
echo ""

echo "📚 Documentation:"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "COMPONENTS.md"
check_file "BLUEPRINT_IMPLEMENTATION.md"
check_file "STRUCTURE.md"
echo ""

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules/ (dependencies installed)"
else
    echo -e "${YELLOW}⚠${NC} node_modules/ (dependencies not installed - run 'npm install')"
fi
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local (configured)"
else
    echo -e "${YELLOW}⚠${NC} .env.local (not configured - copy from .env.local.example)"
fi
echo ""

echo "========================================"
echo "✅ Installation verification complete!"
echo ""
echo "Next steps:"
echo "1. Run './setup.sh' if not done already"
echo "2. Configure .env.local with Supabase credentials"
echo "3. Run database/schema.sql in Supabase"
echo "4. Run 'npm run dev' to start development"
echo ""
