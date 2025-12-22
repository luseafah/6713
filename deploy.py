#!/usr/bin/env python3
"""
Direct Supabase migration deployment via REST API
No dependencies required - uses only Python standard library
"""

import json
import urllib.request
import urllib.error
import sys
from pathlib import Path

SUPABASE_URL = "https://vsxrvrtnwvslmuvykhhy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeHJ2cnRud3ZzbG11dnlraGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxODU3ODEsImV4cCI6MjA4MTc2MTc4MX0.OUhpumN1urS3fL7NOjz4S_e8L3waR_agQd8bzATu09w"

def execute_sql(sql_content, filename):
    """Execute SQL via Supabase REST API"""
    print(f"📄 Executing: {filename}")
    
    # Try direct SQL execution endpoint
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    data = json.dumps({"query": sql_content}).encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = response.read().decode('utf-8')
            print(f"✅ Success: {filename}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ Error {e.code}: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def main():
    base_dir = Path(__file__).parent.parent / "database"
    
    migrations = [
        "DEPLOY-ALL-IN-ONE.sql",
        "migration-wall-chat-heartbeat.sql",
        "migration-hamburger-search.sql",
        "migration-profile-page.sql",
        "migration-pulse-chat.sql"
    ]
    
    print("🚀 Deploying migrations to Supabase...")
    print(f"📍 Project: vsxrvrtnwvslmuvykhhy.supabase.co")
    print("")
    
    success_count = 0
    for migration_file in migrations:
        filepath = base_dir / migration_file
        
        if not filepath.exists():
            print(f"⚠️  File not found: {migration_file}")
            continue
        
        sql_content = filepath.read_text(encoding='utf-8')
        
        if execute_sql(sql_content, migration_file):
            success_count += 1
        else:
            print(f"❌ Failed to execute {migration_file}")
            print("Stopping deployment...")
            sys.exit(1)
        
        print("")
    
    print(f"🎉 Successfully deployed {success_count}/{len(migrations)} migrations!")
    print("")
    print("Next steps:")
    print("1. Go to Supabase Dashboard → SQL Editor")
    print("2. Verify tables: profiles, wall_messages, etc.")
    print("3. Test sign-up flow")
    print("4. Deploy to Vercel")

if __name__ == "__main__":
    main()
