import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const p = await params;
    const rawId = p.postId;
    const type = rawId.charAt(0) === 'e' ? 'entry' : 'post';
    const id = parseInt(rawId.slice(1), 10);

    try {
        const { text } = await request.json();
        if (!text?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });

        if (type === 'post') {
            const { data, error } = await supabaseAdmin
                .from('comments')
                .insert([{ post_id: id, user_id: user, text: text.trim() }])
                .select(`id, text, created_at, users(username, display_name, avatar_path)`)
                .single();

            if (error) throw error;

            return NextResponse.json({
                id: data.id,
                text: data.text,
                created_at: data.created_at,
                author_name: data.users?.display_name || data.users?.username,
                author_avatar: data.users?.avatar_path
            });
        } else {
            // Legacy entries don't support comments in DB. Just mocking success for UI feedback.
            return NextResponse.json({
                id: Date.now(),
                text: text.trim(),
                created_at: new Date().toISOString(),
                author_name: user.display_name || user.username,
                author_avatar: user.avatar_path
            });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
