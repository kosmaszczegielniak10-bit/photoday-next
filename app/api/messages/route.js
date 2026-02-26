// app/api/messages/route.js — GET conversation list

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = supabaseAdmin;

    const { data: convs, error } = await db
        .from('conversations')
        .select('id, user_a, user_b, last_message_at')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!convs.length) return NextResponse.json([]);

    const partnerIds = convs.map(c => c.user_a === userId ? c.user_b : c.user_a);

    const { data: partners } = await db
        .from('users')
        .select('id, username, display_name, avatar_path')
        .in('id', partnerIds);

    const partnerMap = Object.fromEntries((partners || []).map(u => [u.id, u]));

    // Get last message + unread count per conversation
    const enriched = await Promise.all(convs.map(async c => {
        const partnerId = c.user_a === userId ? c.user_b : c.user_a;
        const partner = partnerMap[partnerId] || {};

        const [lastMsgRes, unreadRes] = await Promise.all([
            db.from('messages').select('text').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).single(),
            db.from('messages').select('id', { count: 'exact' }).eq('conversation_id', c.id).neq('sender_id', userId).eq('is_read', 0),
        ]);

        return {
            partner_id: partnerId,
            username: partner.username,
            display_name: partner.display_name,
            avatar_path: partner.avatar_path,
            last_text: lastMsgRes.data?.text || '',
            unread_count: unreadRes.count || 0,
        };
    }));

    return NextResponse.json(enriched);
}
