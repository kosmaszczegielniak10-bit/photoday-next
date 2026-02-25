import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabase() {
    console.log('--- SUPABASE DIAGNOSTICS ---');

    // 1. Check users
    const { data: users, error: userErr } = await supabase.from('users').select('id, username').limit(3);
    console.log('Users:', userErr ? 'ERROR: ' + userErr.message : (users.length + ' found (sample: ' + users.map(u => u.username).join(',') + ')'));

    // 2. Check friendships
    const { data: friends, error: friendErr } = await supabase.from('friendships').select('id').limit(3);
    console.log('Friendships:', friendErr ? 'ERROR: ' + friendErr.message : (friends.length + ' found'));

    // 3. Check Messages
    const { data: msg, error: msgErr } = await supabase.from('messages').select('id').limit(3);
    console.log('Messages:', msgErr ? 'ERROR: ' + msgErr.message : (msg.length + ' found'));

    // 4. Check bucket public publicUrl
    const { data: bucketData, error: bucketErr } = await supabase.storage.getBucket('uploads');
    console.log('Uploads Bucket exists:', bucketErr ? 'NO (' + bucketErr.message + ')' : 'YES (public: ' + bucketData.public + ')');

    // 5. Check files in uploads
    const { data: files, error: filesErr } = await supabase.storage.from('uploads').list('', { limit: 5 });
    console.log('Files in root of uploads:', filesErr ? 'ERROR: ' + filesErr.message : (files?.length + ' found (sample: ' + files?.map(f => f.name).join(', ') + ')'));

}

testSupabase();
