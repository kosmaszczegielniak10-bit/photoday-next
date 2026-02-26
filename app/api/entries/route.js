// app/api/entries/route.js — GET (list for month) and POST (create/upsert)

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear());
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1);

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-31`;

    try {
        const db = supabaseAdmin;
        const { data, error } = await db
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start)
            .lte('date', end)
            .is('deleted_at', null)
            .order('date', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { date, description = '', mood = '', privacy = 'private', photoPath } = await request.json();
        if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

        const db = supabaseAdmin;
        const now = Date.now();

        // Handle base64 photo upload to Supabase Storage
        let finalPhotoPath = photoPath;
        if (photoPath?.startsWith('data:image')) {
            const base64Data = photoPath.split(',')[1];
            const mimeType = photoPath.split(';')[0].split(':')[1];
            const ext = mimeType.split('/')[1];
            const filename = `${userId}/${date}-${Date.now()}.${ext}`;
            const buffer = Buffer.from(base64Data, 'base64');

            const { error: upErr } = await db.storage
                .from('uploads')
                .upload(filename, buffer, { contentType: mimeType, upsert: true });
            if (upErr) throw upErr;

            const { data: { publicUrl } } = db.storage.from('uploads').getPublicUrl(filename);
            finalPhotoPath = publicUrl;
        }

        // Upsert (update if exists for this date, insert if not)
        const { data, error } = await db
            .from('entries')
            .upsert({
                user_id: userId,
                date,
                description,
                mood,
                privacy,
                photo_path: finalPhotoPath ?? null,
                updated_at: now,
            }, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error('/api/entries POST error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
