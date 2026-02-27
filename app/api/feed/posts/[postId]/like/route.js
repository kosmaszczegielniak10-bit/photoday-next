import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawId = params.postId; // e.g. "p12" or "e45"
    const type = rawId.charAt(0) === 'e' ? 'entry' : 'post';
    const id = parseInt(rawId.slice(1), 10);

    try {
        if (type === 'entry') {
            const { error: entryErr } = await supabaseAdmin
                .from('reactions')
                .insert([{ entry_id: id, user_id: user }]);
            if (entryErr && entryErr.code !== '23505') throw entryErr;
        } else {
            const { error: postErr } = await supabaseAdmin
                .from('post_likes')
                .insert([{ post_id: id, user_id: user }]);
            if (postErr && postErr.code !== '23505') throw postErr;
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawId = params.postId;
    const type = rawId.charAt(0) === 'e' ? 'entry' : 'post';
    const id = parseInt(rawId.slice(1), 10);

    try {
        if (type === 'entry') {
            const { error: entryErr } = await supabaseAdmin
                .from('reactions')
                .delete()
                .match({ entry_id: id, user_id: user });
            if (entryErr) throw entryErr;
        } else {
            const { error: postErr } = await supabaseAdmin
                .from('post_likes')
                .delete()
                .match({ post_id: id, user_id: user });
            if (postErr) throw postErr;
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
