import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawId = params.postId; // e.g. "p12" or "e45"
    const type = rawId.charAt(0) === 'e' ? 'entry' : 'post';
    const id = parseInt(rawId.slice(1), 10);

    try {
        if (type === 'entry') {
            const { error } = await supabaseAdmin
                .from('reactions')
                .insert([{ entry_id: id, user_id: user }]);
            // Ignore unique constraint errors
            if (error && error.code !== '23505') throw error;
        } else {
            // For new posts, if we had a post_reactions table we'd add it here.
            // Currently just returning success to keep UI happy.
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
            const { error } = await supabaseAdmin
                .from('reactions')
                .delete()
                .match({ entry_id: id, user_id: user });
            if (error) throw error;
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
