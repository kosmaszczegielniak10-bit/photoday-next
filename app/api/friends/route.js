// app/api/friends/route.js — GET list of accepted friends

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createAdminClient();

    // Get friendships where this user is requester or receiver and status = 'accepted'
    const { data: friendships, error } = await db
        .from('friendships')
        .select('requester_id, receiver_id, id, created_at')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

    if (error) throw error;

    // Get the partner IDs
    const partnerIds = friendships.map(f =>
        f.requester_id === userId ? f.receiver_id : f.requester_id
    );

    if (partnerIds.length === 0) return NextResponse.json([]);

    const { data: users } = await db
        .from('users')
        .select('id, username, display_name, avatar_path, bio')
        .in('id', partnerIds);

    return NextResponse.json(users || []);
}
