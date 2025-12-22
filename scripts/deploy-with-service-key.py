#!/usr/bin/env python3
"""
Deploy Supabase migrations using service_role key
Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
"""

import json
import urllib.request
import urllib.error
import sys
import os
from pathlib import Path

def load_env():
    """Load environment variables from .env.local"""
    env_file = Path(__file__).parent.parent / ".env.local"
    env_vars = {}
    
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    return env_vars

def execute_sql(sql_content, filename, service_key, supabase_url):
    """Execute SQL via Supabase Management API"""
    print(f"📄 Executing: {filename}...")
    
    # Use the Supabase REST API with service role key
    url = f"{supabase_url}/rest/v1/rpc/exec_sql"
    
    data = json.dumps({"query": sql_content}).encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = response.read().decode('utf-8')
            print(f"✅ {filename}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ HTTP {e.code}: {error_body}")
        
        # If exec_sql doesn't exist, try direct SQL execution
        if e.code == 404:
            print("⚠️  RPC endpoint not found, trying direct PostgreSQL connection...")
            return execute_sql_direct(sql_content, filename, service_key, supabase_url)
        return False
    except Exception as e:
        print(f"❌ {str(e)}")
        return False

def execute_sql_direct(sql_content, filename, service_key, supabase_url):
    """Execute SQL via Supabase PostgREST directly"""
    # Split SQL into statements and execute one by one
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    print(f"   Executing {len(statements)} statements...")
    
    for i, stmt in enumerate(statements, 1):
        if not stmt:
            continue
        
        url = f"{supabase_url}/rest/v1/rpc/exec"
        data = json.dumps({"sql": stmt}).encode('utf-8')
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                print(f"   [{i}/{len(statements)}] ✓", end='\r')
        except Exception as e:
            print(f"\n   ❌ Statement {i} failed: {str(e)}")
            return False
    
    print(f"\n✅ {filename}")
    return True

def main():
    # Load environment variables
    env = load_env()
    
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
    supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
    
    if not service_key or service_key == 'your_service_role_key_here':
        print("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
        print("")
        print("To get your service role key:")
        print("1. Go to: https://supabase.com/dashboard/project/vsxrvrtnwvslmuvykhhy/settings/api")
        print("2. Copy the 'service_role' key (under 'Project API keys')")
        print("3. Paste it in .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here")
        print("")
        sys.exit(1)
    
    if not supabase_url:
        print("❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local")
        sys.exit(1)
    
    base_dir = Path(__file__).parent.parent / "database"
    
    migrations = [
        "DEPLOY-ALL-IN-ONE.sql",
        "migration-wall-chat-heartbeat.sql",
        "migration-hamburger-search.sql",
        "migration-profile-page.sql",
        "migration-pulse-chat.sql"
    ]
    
    print("🚀 Deploying migrations to Supabase")
    print(f"📍 Project: {supabase_url}")
    print(f"🔑 Using service_role key")
    print("")
    
    success_count = 0
    for migration_file in migrations:
        filepath = base_dir / migration_file
        
        if not filepath.exists():
            print(f"⚠️  File not found: {migration_file}")
            continue
        
        sql_content = filepath.read_text(encoding='utf-8')
        
        if execute_sql(sql_content, migration_file, service_key, supabase_url):
            success_count += 1
        else:
            print(f"\n❌ Failed: {migration_file}")
            print("💡 Try running migrations manually in Supabase Dashboard")
            sys.exit(1)
        
        print("")
    
    print(f"🎉 Deployed {success_count}/{len(migrations)} migrations!")
    print("")
    print("✅ Database ready!")
    print("Next: Test sign-up at your app URL")

if __name__ == "__main__":
    main()
