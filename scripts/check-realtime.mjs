import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enableRealtime() {
    // We can't directly alter publication from data api, but we can query if it's working or we can just run an RPC
    // Let's just create a quick SQL query using rpc or check if there's any error
    // If not possible, I'll notify the user.
    const { data, error } = await supabase.from('messages').select('id').limit(1);
    console.log("Check:", error || "OK");
}
enableRealtime();
