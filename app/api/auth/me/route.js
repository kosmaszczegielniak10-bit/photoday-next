// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: user } = await supabaseAdmin.from('users')
            .select('id, username, display_name, email, bio, avatar_path, created_at')
            .eq('id', userId)
            .single();

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user);
    } catch (err) {
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { displayName, bio } = await request.json();
        const { data: user } = await supabaseAdmin.from('users')
            .update({ display_name: displayName, bio })
            .eq('id', userId)
            .select('id, username, display_name, email, bio, avatar_path, created_at')
            .single();

        return NextResponse.json(user);
    } catch (err) {
        return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
    }
}
