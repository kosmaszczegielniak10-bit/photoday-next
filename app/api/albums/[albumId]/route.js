// app/api/albums/[albumId]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const albumId = p.albumId;

    try {
        const db = supabaseAdmin;

        // Fetch album metadata
        const { data: album, error: albumErr } = await db
            .from('albums')
            .select('*')
            .eq('id', albumId)
            .eq('user_id', userId)
            .single();

        if (albumErr) throw albumErr;

        // Fetch associated photos via junction table
        const { data: relations, error: relErr } = await db
            .from('album_entries')
            .select(`
                entry_id,
                entries (
                    id, photo_path, date, created_at
                )
            `)
            .eq('album_id', albumId)
            .order('added_at', { ascending: false });

        if (relErr) throw relErr;

        const photos = relations
            .filter(r => r.entries && r.entries.photo_path) // Only keep valid ones with photos
            .map(r => ({
                id: r.entries.id,
                photo_path: r.entries.photo_path,
                date: r.entries.date,
                created_at: r.entries.created_at
            }));

        return NextResponse.json({
            ...album,
            count: photos.length,
            photos
        });

    } catch (err) {
        console.error('Fetch album err:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const albumId = p.albumId;

    try {
        const body = await request.json();
        const db = supabaseAdmin;

        const updateData = {};
        if (body.title !== undefined) updateData.title = body.title.trim();
        if (body.cover_photo_path !== undefined) updateData.cover_photo_path = body.cover_photo_path;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: album, error } = await db
            .from('albums')
            .update(updateData)
            .eq('id', albumId)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) throw error;
        return NextResponse.json(album);

    } catch (err) {
        console.error('Update album err:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
