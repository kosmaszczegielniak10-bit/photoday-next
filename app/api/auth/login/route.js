// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { verifyPassword, signToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email/nazwa użytkownika i hasło są wymagane' }, { status: 400 });
        }

        const identifier = email.toLowerCase().trim();

        // Try email first, then username
        let { data: user } = await supabaseAdmin.from('users')
            .select('id, username, display_name, email, bio, avatar_path, password_hash, created_at')
            .eq('email', identifier)
            .maybeSingle();

        // Fallback: try username
        if (!user) {
            const result = await supabaseAdmin.from('users')
                .select('id, username, display_name, email, bio, avatar_path, password_hash, created_at')
                .eq('username', identifier)
                .maybeSingle();
            user = result.data;
        }

        if (!user) {
            return NextResponse.json({ error: 'Nieprawidłowy email/nazwa użytkownika lub hasło' }, { status: 401 });
        }

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Nieprawidłowy email/nazwa użytkownika lub hasło' }, { status: 401 });
        }

        const token = signToken(user);
        const { password_hash: _, ...safeUser } = user;

        const res = NextResponse.json({ user: safeUser, token });
        res.cookies.set('photoday_token', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', maxAge: 60 * 60 * 24 * 90, path: '/',
        });
        return res;
    } catch (err) {
        console.error('/auth/login error:', err);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
