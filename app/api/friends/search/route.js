import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) return NextResponse.json([]);

    try {
        // Search users by username or display_name
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, username, display_name, bio, avatar_path')
            .neq('id', user)
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        if (!users.length) return NextResponse.json([]);

        // Check friendship status for the returned users
        const userIds = users.map(u => u.id);
        const { data: friendships } = await supabaseAdmin
            .from('friendships')
            .select('id, requester_id, receiver_id, status')
            .or(`and(requester_id.eq.${user},receiver_id.in.(${userIds.join(',')})),and(receiver_id.eq.${user},requester_id.in.(${userIds.join(',')}))`);

        const fMap = new Map();
        (friendships || []).forEach(f => {
            const otherId = f.requester_id === user ? f.receiver_id : f.requester_id;
            fMap.set(otherId, { status: f.status, id: f.id, isRequester: f.requester_id === user });
        });

        // Map to response format
        const results = users.map(u => {
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
        });

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
