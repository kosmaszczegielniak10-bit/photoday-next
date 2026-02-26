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

    // 1. Uploads bucket
    let { error: pErr } = await supabase.storage.updateBucket('uploads', { public: true });
    if (pErr && pErr.message.includes('not found')) {
        console.log("Creating 'uploads' bucket...");
        await supabase.storage.createBucket('uploads', { public: true });
    } else if (pErr) console.error("Error 'uploads':", pErr.message);
    else console.log("Success: 'uploads' bucket is now public.");
}

fixBuckets();
