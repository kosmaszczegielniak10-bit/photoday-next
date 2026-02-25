import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Find pending requests where the current user is the receiver
        const { data: requests, error } = await supabaseAdmin
            .from('friendships')
            .select('id, requester_id, users!friendships_requester_id_fkey(username, display_name, avatar_path)')
            .eq('receiver_id', user)
            .eq('status', 'pending');

        if (error) throw error;

        const pending = requests.map(r => ({
            id: r.id,
            requesterId: r.requester_id,
            username: r.users?.username,
            displayName: r.users?.display_name,
            avatarPath: r.users?.avatar_path,
        }));

        return NextResponse.json(pending);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
