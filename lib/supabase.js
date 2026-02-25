// lib/supabase.js — Supabase client (browser + server)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Check .env.local');
}

// Browser-safe client (uses anon key, respects RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-only admin client (bypasses RLS — only use in API routes)
export function createAdminClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}
