// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { verifyPassword, signToken } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email i hasło są wymagane' }, { status: 400 });
        }

        const db = createAdminClient();
        const { data: user } = await db.from('users')
            .select('id, username, display_name, email, bio, avatar_path, password_hash, created_at')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (!user) {
            return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
        }

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
        }

        const token = signToken(user.id);
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
