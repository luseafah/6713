import { supabaseAdmin } from '@/lib/supabase/server';

export async function usernameLogin(identifier: string, password: string) {
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
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}
