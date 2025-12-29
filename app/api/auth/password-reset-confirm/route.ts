import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

  const { access_token, new_password } = await req.json();
  const { error } = await supabaseAdmin.auth.updateUser({ password: new_password }, { access_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
