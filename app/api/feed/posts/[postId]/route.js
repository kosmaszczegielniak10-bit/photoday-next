import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawId = params.postId;
    const type = rawId.charAt(0) === 'e' ? 'entry' : 'post';
    const id = parseInt(rawId.slice(1), 10);

    try {
        if (type === 'post') {
            const { error } = await supabaseAdmin
                .from('posts')
                .delete()
                .match({ id, user_id: user });
            if (error) throw error;
        } else if (type === 'entry') {
            const { error } = await supabaseAdmin
                .from('entries')
                .delete()
                .match({ id, user_id: user });
            if (error) throw error;
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
