import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requestId = params.requestId;

    try {
        // Ensure the request belongs to the current user and is pending
        const { data, error: fetchErr } = await supabaseAdmin
            .from('friendships')
            .select('receiver_id, status')
            .eq('id', requestId)
            .single();

        if (fetchErr || !data) throw new Error('Nie znaleziono zaproszenia');
        if (String(data.receiver_id) !== String(user)) throw new Error('Brak uprawnień');
        if (data.status !== 'pending') throw new Error('Zaproszenie zostało już obsłużone');

        // Update status to accepted
        const { error } = await supabaseAdmin
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
