import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, username, display_name, bio, avatar_path')
            .neq('id', user)
            .limit(50);

        if (error) throw error;

        // Get friendships involving this user
        const { data: friendships } = await supabaseAdmin
            .from('friendships')
            .select('id, requester_id, receiver_id, status')
            .or(`requester_id.eq.${user},receiver_id.eq.${user}`);

        const fMap = new Map();
        (friendships || []).forEach(f => {
            const otherId = f.requester_id === user ? f.receiver_id : f.requester_id;
            fMap.set(otherId, { status: f.status, id: f.id, isRequester: f.requester_id === user });
        });

        // Map to original response format
        const friendsList = data.map(u => {
            const f = fMap.get(u.id);
            let friendStatus = 'none';
            if (f?.status === 'accepted') friendStatus = 'friends';
            else if (f?.status === 'pending') friendStatus = f.isRequester ? 'sent' : 'received';

            return {
                id: u.id,
                username: u.username,
                name: u.display_name || u.username,
                bio: u.bio || '',
                avatar: u.avatar_path,
                friendStatus,
                friendshipId: f?.id
            };
        }).filter(u => u.friendStatus === 'friends'); // Return only ACCEPTED friends

        return NextResponse.json(friendsList);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
