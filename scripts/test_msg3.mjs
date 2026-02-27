import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMsgInsert() {
    const db = supabase;
    const userId = 1; // Existing
    const convId = 2; // Existing from test_msg2

    console.log(`Inserting message for user ${userId} in conv ${convId}`);

    const { data: msg, error } = await db
        .from('messages')
        .insert({
            conversation_id: convId,
            sender_id: userId,
            text: "Hello from test!",
            created_at: Date.now(),
        })
        .select()
        .single();

    if (error) {
        console.error('MESSAGES INSERT ERROR:', error);
    } else {
        console.log('Success, msg id:', msg.id);
    }
}
testMsgInsert();
