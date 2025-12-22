#!/bin/sh
# Deploy migrations to Supabase using direct HTTPS API calls

SUPABASE_URL="https://vsxrvrtnwvslmuvykhhy.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeHJ2cnRud3ZzbG11dnlraGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxODU3ODEsImV4cCI6MjA4MTc2MTc4MX0.OUhpumN1urS3fL7NOjz4S_e8L3waR_agQd8bzATu09w"

echo "🚀 Deploying migrations to Supabase..."
echo ""

# Function to execute SQL via RPC
execute_sql() {
  local sql_file="$1"
  local sql_content=$(cat "$sql_file")
  
  echo "📄 Executing: $sql_file"
  
  response=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}")
  
  if echo "$response" | grep -q "error"; then
    echo "❌ Error executing $sql_file"
    echo "$response"
    return 1
  else
    echo "✅ Successfully executed $sql_file"
    return 0
  fi
}

# Deploy master schema
echo "=== STEP 1: Master Schema ==="
execute_sql "/workspaces/6713/database/DEPLOY-ALL-IN-ONE.sql" || exit 1
echo ""

# Deploy feature migrations
echo "=== STEP 2: Wall Chat Heartbeat ==="
execute_sql "/workspaces/6713/database/migration-wall-chat-heartbeat.sql" || exit 1
echo ""

echo "=== STEP 3: Hamburger Search ==="
execute_sql "/workspaces/6713/database/migration-hamburger-search.sql" || exit 1
echo ""

echo "=== STEP 4: Profile Page ==="
execute_sql "/workspaces/6713/database/migration-profile-page.sql" || exit 1
echo ""

echo "=== STEP 5: Pulse Chat ==="
execute_sql "/workspaces/6713/database/migration-pulse-chat.sql" || exit 1
echo ""

echo "🎉 ALL MIGRATIONS DEPLOYED SUCCESSFULLY!"
echo ""
echo "Next steps:"
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Verify tables created: profiles, wall_messages, etc."
echo "3. Test sign-up: Should auto-create profile"
echo "4. Deploy to Vercel if not already deployed"
