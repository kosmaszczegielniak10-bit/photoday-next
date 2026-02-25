// app/api/entries/[date]/route.js — GET single entry by date

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request, { params }) {
    const userId = await requireAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date } = await params;
    const db = createAdminClient();

    const { data } = await db
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .is('deleted_at', null)
        .single();

    if (!data) return NextResponse.json(null);
    return NextResponse.json(data);
}
