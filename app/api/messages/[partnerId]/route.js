// app/api/messages/[partnerId]/route.js — GET chat history + POST send message

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getOrCreateConversation(db, userId, partnerId) {
    const num1 = Number(userId);
    const num2 = Number(partnerId);
    const ua = Math.min(num1, num2);
    const ub = Math.max(num1, num2);

    const { data: existing } = await db
        .from('conversations')
        .select('id')
        .eq('user_a', ua)
        .eq('user_b', ub)
        .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await db
        .from('conversations')
        .insert({ user_a: ua, user_b: ub, last_message_at: Date.now() })
        .select('id')
        .single();

    if (error) throw new Error(error.message);
    return created.id;
}

export async function GET(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { partnerId } = await params;
    const db = supabaseAdmin;

    const convId = await getOrCreateConversation(db, userId, partnerId);

    // Mark partner's messages as read
    await db.from('messages')
        .update({ is_read: 1 })
        .eq('conversation_id', convId)
        .neq('sender_id', userId);

    const { data: messages } = await db
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(100);

    return NextResponse.json({ conversationId: convId, messages: messages || [] });
}

export async function POST(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { partnerId } = await params;
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    const db = supabaseAdmin;
    const convId = await getOrCreateConversation(db, userId, partnerId);

    const { data: msg, error } = await db
        .from('messages')
        .insert({
            conversation_id: convId,
            sender_id: userId,
            text: text.trim(),
            created_at: Date.now(),
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update last_message_at on conversation
    await db.from('conversations').update({ last_message_at: Date.now() }).eq('id', convId);

    return NextResponse.json(msg, { status: 201 });
}
