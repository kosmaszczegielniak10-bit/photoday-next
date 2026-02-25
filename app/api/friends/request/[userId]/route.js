import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params }) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const receiverId = params.userId;
    if (!receiverId || receiverId === String(user)) {
        return NextResponse.json({ error: 'Nieprawidłowy użytkownik' }, { status: 400 });
    }

    try {
        // Check if friendship already exists
        const { data: existing } = await supabaseAdmin
            .from('friendships')
            .select('id')
            .or(`and(requester_id.eq.${user},receiver_id.eq.${receiverId}),and(receiver_id.eq.${user},requester_id.eq.${receiverId})`)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Zaproszenie już istnieje lub jesteście znajomymi' }, { status: 400 });
        }

        // Create pending request
        const { error } = await supabaseAdmin
            .from('friendships')
            .insert([
                { requester_id: user, receiver_id: receiverId, status: 'pending' }
            ]);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
