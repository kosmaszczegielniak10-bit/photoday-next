#!/usr/bin/env node
// scripts/import-local.mjs — Imports /tmp/railway-export.json into Supabase
// Run: node scripts/import-local.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = join(__dirname, '..', '.env.local');
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
});

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function upsert(table, rows, conflict = 'id') {
    if (!rows?.length) { console.log(`  ⏭  ${table}: 0 rows`); return; }
    const { error } = await sb.from(table).upsert(rows, { onConflict: conflict });
    if (error) { console.error(`  ❌ ${table}: ${error.message}`); return; }
    console.log(`  ✓ ${table}: ${rows.length} rows`);
}

async function run() {
    console.log('\n🚀 Importing Railway data into Supabase...\n');

    const raw = readFileSync('/tmp/railway-export.json', 'utf-8');
    const { data } = JSON.parse(raw);

    await upsert('users', data.users?.map(u => ({
        id: u.id, username: u.username, email: u.email,
        password_hash: u.password_hash, display_name: u.display_name,
        bio: u.bio || '', avatar_path: u.avatar_path || null,
        created_at: u.created_at,
    })));

    await upsert('entries', data.entries?.map(e => ({
        id: e.id, user_id: e.user_id, date: e.date,
        photo_path: e.photo_path || null, description: e.description || '',
        mood: e.mood || '', privacy: e.privacy || 'private',
        created_at: e.created_at, updated_at: e.updated_at, deleted_at: e.deleted_at || null,
    })));

    await upsert('friendships', data.friendships?.map(f => ({
        id: f.id, requester_id: f.requester_id, receiver_id: f.receiver_id,
        status: f.status, created_at: f.created_at,
    })));

    await upsert('reactions', data.reactions?.map(r => ({
        id: r.id, user_id: r.user_id, entry_id: r.entry_id,
        type: r.type || 'like', created_at: r.created_at,
    })));

    await upsert('notifications', data.notifications?.map(n => ({
        id: n.id, user_id: n.user_id, actor_id: n.actor_id,
        type: n.type, entity_id: n.entity_id || null,
        is_read: n.is_read || 0, created_at: n.created_at,
    })));

    // Railway uses 'title' not 'name', and 'cover_photo_path' not 'cover_path'
    await upsert('albums', data.albums?.map(a => ({
        id: a.id, user_id: a.user_id,
        name: a.title || a.name || 'Album',
        description: a.description || '',
        cover_path: a.cover_photo_path || a.cover_path || null,
        created_at: a.created_at,
    })));

    await upsert('album_entries', data.album_entries?.map(ae => ({
        album_id: ae.album_id, entry_id: ae.entry_id, added_at: ae.added_at,
    })), 'album_id,entry_id');

    await upsert('posts', data.posts?.map(p => ({
        id: p.id, user_id: p.user_id, entry_id: p.entry_id || null,
        photo_path: p.photo_path || null, caption: p.caption || '',
        privacy: p.privacy || 'friends', created_at: p.created_at,
    })));

    await upsert('comments', data.comments?.map(c => ({
        id: c.id, post_id: c.post_id, user_id: c.user_id,
        text: c.text, created_at: c.created_at,
    })));

    await upsert('conversations', data.conversations?.map(c => ({
        id: c.id,
        user_a: Math.min(c.user_a, c.user_b),
        user_b: Math.max(c.user_a, c.user_b),
        last_message_at: c.last_message_at,
    })));

    await upsert('messages', data.messages?.map(m => ({
        id: m.id, conversation_id: m.conversation_id,
        sender_id: m.sender_id, text: m.text || '',
        photo_path: m.photo_path || null, is_read: m.is_read || 0,
        created_at: m.created_at,
    })));

    console.log('\n✅ Migration complete! Check Supabase Table Editor to verify.');
    process.exit(0);
}

run().catch(err => {
    console.error('\n❌ Import failed:', err.message);
    process.exit(1);
});
