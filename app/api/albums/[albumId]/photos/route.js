// app/api/albums/[albumId]/photos/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const albumId = p.albumId;

    try {
        const body = await request.json();
        const photoPath = body.photo_path; // We are sending photo_path now. 

        if (!photoPath) {
            return NextResponse.json({ error: 'Brak ścieżki zdjęcia' }, { status: 400 });
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

        // To keep things simple and unified with the current schema, we ensure the photo is an 'entry'
        // If it's a 'post', we create a dummy entry OR if the schema allows text paths, we just insert.
        // Wait, the schema for `album_entries` requires `entry_id`.
        // Let's create an `entry` on the fly for this photo_path if it doesn't exist, to link it.
        const { data: existingEntry } = await db.from('entries').select('id').eq('photo_path', photoPath).single();
        let entryId = existingEntry?.id;

        if (!entryId) {
             const { data: newEntry, error: newEntryErr } = await db.from('entries').insert({
                 user_id: userId,
                 photo_path: photoPath,
                 status: 'published'
             }).select('id').single();
             if (newEntryErr) throw newEntryErr;
             entryId = newEntry.id;
        }

        // Insert into junction table
        const { error: insertErr } = await db
            .from('album_entries')
            .insert({
                album_id: albumId,
                entry_id: entryId
            });

        if (insertErr && insertErr.code !== '23505') {
            throw insertErr;
        }

        // Update the cover photo of the album to this new photo so it looks populated if it didn't have one
        await db.from('albums')
            .update({ cover_photo_path: photoPath })
            .eq('id', albumId)
            .is('cover_photo_path', null);

        return NextResponse.json({ success: true, entryId });

    } catch (err) {
        console.error('Add photo to album err:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const albumId = p.albumId;

    try {
        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get('entryId');

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

        // Delete from junction table
        const { error: deleteErr } = await db
            .from('album_entries')
            .delete()
            .eq('album_id', albumId)
            .eq('entry_id', entryId);

        if (deleteErr) throw deleteErr;

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Remove photo from album err:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
