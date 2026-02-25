import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    try {
        const userId = await requireAuth(request);
        if (!userId) return NextResponse.json({ error: 'Brak dostępu' }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from('albums')
            .select(`
                id, name, created_at, cover_photo_path,
                album_entries ( count )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await requireAuth(request);
        if (!userId) return NextResponse.json({ error: 'Brak dostępu' }, { status: 401 });

        const body = await request.json();
        const { name } = body;
        if (!name) return NextResponse.json({ error: 'Nazwa wymagana' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('albums')
            .insert({ user_id: userId, name })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
