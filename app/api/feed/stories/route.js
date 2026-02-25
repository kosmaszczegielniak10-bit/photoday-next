import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get user's accepted friends
        const { data: friendships } = await supabaseAdmin
            .from('friendships')
            .select('requester_id, receiver_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user},receiver_id.eq.${user}`);

        const friendIds = (friendships || []).map(f => f.requester_id === user ? f.receiver_id : f.requester_id);
        const visibleUsers = [user, ...friendIds];

        // Fetch active stories (non-expired)
        // Note: Railway export didn't have expires_at for legacy entries, but we fetch from 'stories' or mapped 'entries'
        // To match original feed, stories were often entries for today. 
        // Let's fetch entries from today for the user and their friends.
        const todayStr = new Date().toISOString().split('T')[0];

        const { data: stories, error } = await supabaseAdmin
            .from('entries')
            .select('id, photo_path, description, created_at, user_id, users(username, display_name, avatar_path)')
            .in('user_id', visibleUsers)
            .eq('date', todayStr)
            .not('photo_path', 'is', 'null');

        if (error) throw error;

        // Additionally real 'stories' table if used
        const { data: realStories } = await supabaseAdmin
            .from('stories')
            .select('id, photo_path, caption, created_at, user_id, users(username, display_name, avatar_path)')
            .in('user_id', visibleUsers)
            .gte('expires_at', new Date().toISOString());

        const combined = [
            ...(stories || []).map(e => ({
                id: `e${e.id}`, // prefix to avoid id collisons
                user_id: e.user_id,
                photo_path: e.photo_path,
                caption: e.description,
                created_at: e.created_at,
                username: e.users?.username,
                display_name: e.users?.display_name,
                avatar_path: e.users?.avatar_path,
                type: 'entry'
            })),
            ...(realStories || []).map(s => ({
                id: `s${s.id}`,
                user_id: s.user_id,
                photo_path: s.photo_path,
                caption: s.caption,
                created_at: s.created_at,
                username: s.users?.username,
                display_name: s.users?.display_name,
                avatar_path: s.users?.avatar_path,
                type: 'story'
            }))
        ];

        // Deduplicate by user (so each user has 1 circle in the stories bar)
        // Keeping the most recent one for each user
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const uniqueStories = [];
        const seenUsers = new Set();

        for (const s of combined) {
            if (!seenUsers.has(s.user_id)) {
                seenUsers.add(s.user_id);
                uniqueStories.push(s);
            }
        }

        // Always sort so "My Story" is first, if any
        uniqueStories.sort((a, b) => {
            if (a.user_id === user) return -1;
            if (b.user_id === user) return 1;
            return 0;
        });

        return NextResponse.json(uniqueStories);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { photoData, caption, privacy } = await request.json();

        // Convert base64
        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `story-${user}-${Date.now()}.png`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('uploads')
            .upload(filename, buffer, { contentType: 'image/png' });

        if (uploadError) throw new Error('Nie udało się wgrać zdjęcia');

        const photo_path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${filename}`;

        // Expire in 24h
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data, error } = await supabaseAdmin
            .from('stories')
            .insert([{
                user_id: user,
                photo_path,
                caption: caption || '',
                privacy: privacy || 'friends',
                expires_at: expiresAt.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
