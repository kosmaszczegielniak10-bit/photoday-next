// app/api/profile/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request, context) {
    try {
        const currentUserId = await requireAuth(request);
        if (!currentUserId) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

        const params = await context.params;
        const targetUserId = parseInt(params.id, 10);
        if (isNaN(targetUserId)) {
            return NextResponse.json({ error: 'Nieprawidłowe ID użytkownika' }, { status: 400 });
        }

        // Fetch User Profile
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, username, display_name, avatar_path, bio, created_at')
            .eq('id', targetUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 404 });
        }

        // Check Friendship Status
        let friendshipStatus = 'none'; // 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self'
        let friendshipId = null;

        if (currentUserId === targetUserId) {
            friendshipStatus = 'self';
        } else {
            // Check friendships table
            const { data: friendship } = await supabaseAdmin.from('friendships')
                .select('id, status, requester_id')
                .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
                .maybeSingle();

            if (friendship) {
                friendshipId = friendship.id;
                if (friendship.status === 'accepted') {
                    friendshipStatus = 'friends';
                } else if (friendship.status === 'pending') {
                    friendshipStatus = friendship.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
                } else if (friendship.status === 'rejected') {
                    friendshipStatus = 'none';
                }
            }
        }

        // Fetch Posts based on privacy
        // If friends or self, show 'public' and 'friends'
        // If not friends, show 'public' only
        let query = supabaseAdmin.from('posts').select('id, photo_path, caption, created_at, privacy, author_id').eq('author_id', targetUserId).order('created_at', { ascending: false }).limit(20);

        if (friendshipStatus !== 'friends' && friendshipStatus !== 'self') {
            query = query.eq('privacy', 'public');
        }

        const { data: posts } = await query;

        return NextResponse.json({
            user,
            friendship: { status: friendshipStatus, reqId: friendshipId, friendshipId },
            posts: posts || []
        });

    } catch (err) {
        console.error('Profile API error:', err);
        return NextResponse.json({ error: 'Błąd serwera przy pobieraniu profilu' }, { status: 500 });
    }
}
