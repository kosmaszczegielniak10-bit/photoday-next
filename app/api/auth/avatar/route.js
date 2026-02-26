// app/api/auth/avatar/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
    try {
        const userId = await requireAuth(request);
        if (!userId) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

        const { photoData } = await request.json();
        if (!photoData) {
            return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
        }

        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `avatar-${userId}-${Date.now()}.png`;

        // Upload to Supabase Storage 'uploads' bucket (or 'avatars' if customized, using 'uploads' as per posts schema)
        const { error: uploadError } = await supabaseAdmin.storage
            .from('uploads')
            .upload(filename, buffer, { contentType: 'image/png', upsert: true });

        if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            throw new Error('Nie udało się wgrać zdjęcia');
        }

        // Construct public URL
        const avatarPath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${filename}`;

        // Update user record
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({ avatar_path: avatarPath })
            .eq('id', userId);

        if (dbError) throw dbError;

        return NextResponse.json({ avatarPath });
    } catch (error) {
        console.error('Avatar API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
