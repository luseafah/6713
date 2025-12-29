import { supabaseAdmin } from '@/lib/supabase/server';

export async function sendPasswordReset(identifier: string) {
  let email = identifier;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier)) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single();
    if (error || !data?.email) {
      throw new Error('No user found with that username');
    }
    email = data.email;
  }
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
  return true;
}
