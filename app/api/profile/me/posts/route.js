import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch posts and legacy entries for the current user to display in the Add Photos grid
        const { data: posts } = await supabaseAdmin
            .from('posts')
            .select('id, photo_path, created_at')
            .eq('user_id', user)
            .order('created_at', { ascending: false });

        const { data: entries } = await supabaseAdmin
            .from('entries')
            .select('id, photo_path, created_at')
            .eq('user_id', user)
            .not('photo_path', 'is', 'null')
            .order('created_at', { ascending: false });

        // Map and combine
        const combined = [
            ...(posts || []).map(p => ({
                id: `p${p.id}`,
                db_id: p.id,
                photo_path: p.photo_path,
                type: 'post',
                created_at: p.created_at
            })),
            ...(entries || []).map(e => ({
                id: `e${e.id}`,
                db_id: e.id,
                photo_path: e.photo_path,
                type: 'entry',
                created_at: e.created_at
            }))
        ];

        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return NextResponse.json({ posts: combined });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
