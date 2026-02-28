import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Get visible users (me + friends)
        const { data: friendships } = await supabaseAdmin
            .from('friendships')
            .select('requester_id, receiver_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user},receiver_id.eq.${user}`);

        const friendIds = (friendships || []).map(f => f.requester_id === user ? f.receiver_id : f.requester_id);
        const visibleUsers = [user, ...friendIds];

        // 2. Fetch posts from these users + their daily entries (which act as feed posts)

        // Posts table (newly separated posts)
        let { data: postsData } = await supabaseAdmin
            .from('posts')
            .select(`
        id, photo_path, caption, created_at, user_id,
        users(username, display_name, avatar_path),
        comments(id, text, created_at, users(username, display_name, avatar_path))
      `)
            .in('user_id', visibleUsers)
            .order('created_at', { ascending: false })
            .limit(30);

        // Entries table (daily entries also go to feed)
        // Only friends or public entries
        let { data: entriesData } = await supabaseAdmin
            .from('entries')
            .select(`
        id, photo_path, description, created_at, user_id, privacy,
        users(username, display_name, avatar_path)
      `)
            .in('user_id', visibleUsers)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(30);

        // Filter private entries of friends
        entriesData = (entriesData || []).filter(e => e.user_id === user || e.privacy !== 'private');

        // Combine and format
        let rawFeed = [
            ...(postsData || []).map(p => ({
                id: `p${p.id}`,
                db_id: p.id,
                type: 'post',
                author_id: p.user_id,
                author_name: p.users?.display_name || p.users?.username,
                author_avatar: p.users?.avatar_path,
                photo_path: p.photo_path,
                caption: p.caption,
                created_at: p.created_at,
                comments: (p.comments || []).map(c => ({
                    id: c.id,
                    text: c.text,
                    author_name: c.users?.display_name || c.users?.username,
                    author_avatar: c.users?.avatar_path,
                    created_at: c.created_at
                }))
            })),
            ...(entriesData || []).map(e => ({
                id: `e${e.id}`,
                db_id: e.id,
                type: 'entry',
                author_id: e.user_id,
                author_name: e.users?.display_name || e.users?.username,
                author_avatar: e.users?.avatar_path,
                photo_path: e.photo_path,
                caption: e.description,
                created_at: e.created_at,
                comments: [] // entries don't have comments in legacy db schema, but we can extend later
            }))
        ];

        rawFeed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        rawFeed = rawFeed.slice(0, 40);

        // 3. Attach reaction counts and "liked by me" status
        // Fetch all reactions for these entries (reactions table links to entries, not posts in legacy DB. We map it anyway)
        const entryDbIds = rawFeed.filter(f => f.type === 'entry').map(f => f.db_id);
        const postDbIds = rawFeed.filter(f => f.type === 'post').map(f => f.db_id);

        let reactions = [];
        let postLikes = [];

        if (entryDbIds.length > 0) {
            const { data } = await supabaseAdmin
                .from('reactions')
                .select('entry_id, user_id, users(display_name, avatar_path)')
                .in('entry_id', entryDbIds);
            if (data) reactions = data;
        }

        if (postDbIds.length > 0) {
            const { data } = await supabaseAdmin
                .from('post_likes')
                .select('post_id, user_id, users(display_name, avatar_path)')
                .in('post_id', postDbIds);
            if (data) postLikes = data;
        }

        rawFeed.forEach(item => {
            if (item.type === 'entry') {
                const itemReactions = reactions.filter(r => r.entry_id === item.db_id);
                item.like_count = itemReactions.length;
                item.liked = itemReactions.some(r => r.user_id === user);
                item.likers = itemReactions.map(r => ({
                    id: r.user_id,
                    name: r.users?.display_name || 'Użytkownik',
                    avatar: r.users?.avatar_path
                }));
            } else {
                const itemLikes = postLikes.filter(p => p.post_id === item.db_id);
                item.like_count = itemLikes.length;
                item.liked = itemLikes.some(p => p.user_id === user);
                item.likers = itemLikes.map(r => ({
                    id: r.user_id,
                    name: r.users?.display_name || 'Użytkownik',
                    avatar: r.users?.avatar_path
                }));
            }
            item.comment_count = item.comments?.length || 0;
        });

        return NextResponse.json(rawFeed);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const user = await requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { photoData, caption, privacy } = await request.json();
        let photo_path = null;

        if (photoData) {
            const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `post-${user}-${Date.now()}.png`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('uploads')
                .upload(filename, buffer, { contentType: 'image/png' });

            if (uploadError) throw new Error('Błąd wgrywania zdjęcia');
            photo_path = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${filename}`;
        }

        const { data: post, error } = await supabaseAdmin
            .from('posts')
            .insert([{
                user_id: user,
                photo_path,
                caption: caption || '',
                privacy: privacy || 'friends'
            }])
            .select(`id, photo_path, caption, created_at, user_id, users(username, display_name, avatar_path)`)
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: `p${post.id}`,
            db_id: post.id,
            type: 'post',
            author_id: post.user_id,
            author_name: post.users?.display_name || post.users?.username,
            author_avatar: post.users?.avatar_path,
            photo_path: post.photo_path,
            caption: post.caption,
            created_at: post.created_at,
            comments: [],
            comment_count: 0,
            like_count: 0,
            liked: false
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
