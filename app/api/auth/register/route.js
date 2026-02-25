// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { email, username, displayName, password } = await request.json();

        if (!email || !username || !displayName || !password) {
            return NextResponse.json({ error: 'Wszystkie pola są wymagane' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Hasło musi mieć co najmniej 6 znaków' }, { status: 400 });
        }

        const db = createAdminClient();

        // Check unique constraints
        const { data: existing } = await db.from('users')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Email lub nazwa użytkownika jest zajęta' }, { status: 409 });
        }

        const password_hash = await hashPassword(password);

        const { data: user, error } = await db.from('users').insert({
            email: email.toLowerCase().trim(),
            username: username.toLowerCase().trim(),
            display_name: displayName.trim(),
            password_hash,
        }).select('id, username, display_name, email, bio, avatar_path, created_at').single();

        if (error) throw error;

        const token = signToken(user);

        const res = NextResponse.json({ user, token }, { status: 201 });
        res.cookies.set('photoday_token', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', maxAge: 60 * 60 * 24 * 90, path: '/',
        });
        return res;
    } catch (err) {
        console.error('/auth/register error:', err);
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
