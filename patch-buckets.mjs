import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envStr = fs.readFileSync('.env.local', 'utf-8');
const lines = envStr.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBuckets() {
    console.log("Setting storage buckets to public...");

    // 1. Photos bucket
    let { error: pErr } = await supabase.storage.updateBucket('photos', { public: true });
    if (pErr && pErr.message.includes('not found')) {
        console.log("Creating 'photos' bucket...");
        await supabase.storage.createBucket('photos', { public: true });
    } else if (pErr) console.error("Error 'photos':", pErr.message);
    else console.log("Success: 'photos' bucket is now public.");

    // 2. Avatars bucket
    let { error: aErr } = await supabase.storage.updateBucket('avatars', { public: true });
    if (aErr && aErr.message.includes('not found')) {
        console.log("Creating 'avatars' bucket...");
        await supabase.storage.createBucket('avatars', { public: true });
    } else if (aErr) console.error("Error 'avatars':", aErr.message);
    else console.log("Success: 'avatars' bucket is now public.");
}

fixBuckets();
