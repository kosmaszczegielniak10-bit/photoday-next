import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const friendshipId = params.friendshipId;

    try {
        // Validate request ownership
        const { data: request_data } = await supabaseAdmin
            .from('friendships')
            .select('receiver_id, requester_id')
            .eq('id', friendshipId)
            .single();

        if (!request_data || (String(request_data.receiver_id) !== String(user) && String(request_data.requester_id) !== String(user))) {
            return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
        }

        // Delete the friendship row
        const { error } = await supabaseAdmin
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
