import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requestId = params.requestId;

    try {
        // Validate request ownership
        const { data: request_data } = await supabaseAdmin
            .from('friendships')
            .select('receiver_id, requester_id, status')
            .eq('id', requestId)
            .single();

        if (!request_data || String(request_data.receiver_id) !== String(user)) {
            return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
        }

        // Delete the friendship row for rejection
        const { error } = await supabaseAdmin
            .from('friendships')
            .delete()
            .eq('id', requestId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
