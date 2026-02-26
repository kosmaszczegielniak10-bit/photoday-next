// app/api/albums/[albumId]/photos/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const albumId = params.albumId;

    try {
        const { entryId } = await request.json();

        if (!entryId) {
            return NextResponse.json({ error: 'Brak ID zdjęcia' }, { status: 400 });
        }

        const db = supabaseAdmin;

        // Verify the album belongs to the user
        const { data: album, error: albumErr } = await db
            .from('albums')
            .select('id')
            .eq('id', albumId)
            .eq('user_id', userId)
            .single();

        if (albumErr || !album) {
            return NextResponse.json({ error: 'Nie znaleziono albumu lub brak dostępu' }, { status: 404 });
        }

        // Insert into junction table
        const { error: insertErr } = await db
            .from('album_entries')
            .insert({
                album_id: albumId,
                entry_id: entryId
            });

        // The database handles unique constraints, so if it fails with unique violation, it's just already in the album which is fine
        if (insertErr && insertErr.code !== '23505') {
            throw insertErr;
        }

        // Update the cover photo of the album to this new photo so it looks populated if it didn't have one
        // (Just an optimization)
        const { data: entry } = await db.from('entries').select('photo_path').eq('id', entryId).single();
        if (entry?.photo_path) {
            await db.from('albums')
                .update({ cover_photo_path: entry.photo_path })
                .eq('id', albumId)
                .is('cover_photo_path', null);
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Add photo to album err:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
