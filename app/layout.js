import './globals.css';
import Providers from './providers';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata = {
  title: 'PhotoDay — Cyfrowy Pamiętnik',
  description: 'Twój prywatny dziennik fotograficzny',
};

export default async function RootLayout({ children }) {
  // 1. Server-side session hydration
  const cookieStore = await cookies();
  const token = cookieStore.get('photoday_token')?.value;
  let initialUser = null;

  if (token) {
    const payload = verifyToken(token);
    if (payload?.userId) {
      const { data } = await supabaseAdmin.from('users')
        .select('id, username, display_name, email, bio, avatar_path, created_at')
        .eq('id', payload.userId)
        .single();
      if (data) initialUser = data;
    }
  }

  return (
    <html lang="pl">
      <body>
        <Providers initialUser={initialUser}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
