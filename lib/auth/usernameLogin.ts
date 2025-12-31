import { supabaseAdmin } from '@/lib/supabase/server';

export async function usernameLogin(identifier: string, password: string) {
  let email = identifier;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier)) {
    let username = identifier;
    if (username && !username.startsWith('@')) {
      username = '@' + username.replace(/^@+/, '');
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', username)
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
