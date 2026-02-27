import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMsg() {
    // 1. Get 2 users
    const { data: users } = await supabase.from('users').select('id, username').limit(2);
    if (!users || users.length < 2) return console.log('Need at least 2 users');

    const u1 = users[0].id; // BigInt (as number usually if safe)
    const u2 = users[1].id;

    console.log(`Users: ${u1} vs ${u2}`);

    // Simulate getOrCreateConversation
    const num1 = Number(u1);
    const num2 = Number(u2);
    const ua = Math.min(num1, num2);
    const ub = Math.max(num1, num2);

    console.log(`Sorted: A=${ua}, B=${ub}, A < B ? ${ua < ub}`);

    // Try Insert
    const { data, error } = await supabase
        .from('conversations')
        .insert({ user_a: ua, user_b: ub, last_message_at: Date.now() })
        .select('id')
        .single();

    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Success, conv id:', data.id);
    }
}
testMsg();
