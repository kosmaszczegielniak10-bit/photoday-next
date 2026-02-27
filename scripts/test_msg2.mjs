import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMsg() {
    const u1 = 1; // From db
    const u2 = 3;

    const num1 = Number(u1);
    const num2 = Number(u2);
    const ua = Math.min(num1, num2);
    const ub = Math.max(num1, num2);

    // 1. Check getOrCreate
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_a', ua)
        .eq('user_b', ub)
        .maybeSingle();

    console.log("Existing via UA=1, UB=3?", existing);

    // 2. Try doing it via the actual route simulating the fetch

}
testMsg();
