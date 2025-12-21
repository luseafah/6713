#!/bin/bash
# 6713 Genesis Build - Database Setup Script

echo "🚀 Setting up 6713 Genesis Build database..."

# Check if database schema file exists
if [ ! -f "database/schema.sql" ]; then
    echo "❌ Error: database/schema.sql not found"
    exit 1
fi

echo "📊 Applying database schema..."
# Note: Replace with your actual Supabase connection details
# Example using psql:
# psql -h your-supabase-host -U postgres -d your-database -f database/schema.sql

echo ""
echo "✅ Database schema ready!"
echo ""
echo "📝 Manual Setup Required:"
echo "1. Connect to your Supabase project"
echo "2. Run the SQL from database/schema.sql in the SQL Editor"
echo "3. Verify these tables were created:"
echo "   - users"
echo "   - profiles"
echo "   - system_settings"
echo "   - wall_messages"
echo "   - comments"
echo "   - cpr_rescues"
echo "   - cpr_log (NEW)"
echo "   - fourth_wall_breaks (NEW)"
echo "   - admin_post_overrides (NEW)"
echo "   - dm_threads"
echo "   - dm_messages"
echo "   - wall_reactions"
echo "   - post_cooldowns"
echo ""
echo "🎨 Genesis Build Features:"
echo "   ✨ Glaze Protocol (Admin God-Mode)"
echo "   🔮 13th Revelation (CPR Batch System)"
echo "   💀 Void & Shrine Agency (72h Lockout)"
echo "   🚫 Whisper Gating (Break 4th Wall)"
echo ""
echo "🔧 To enable admin features:"
echo "   1. Set MOCK_USER.isAdmin = true in:"
echo "      - app/settings/page.tsx"
echo "      - app/wall/page.tsx"
echo "   2. Or update user role in database:"
echo "      UPDATE users SET role = 'admin' WHERE id = 'your-user-id';"
echo ""
echo "📖 Read GENESIS_BUILD_SUMMARY.md for full documentation"
