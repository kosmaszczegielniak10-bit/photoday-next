#!/usr/bin/env node
/**
 * PhotoDay — Railway → Supabase Import Script
 * Fetches ALL data from the live Railway export endpoint and upserts into Supabase.
 *
 * Usage:
 *   RAILWAY_URL=https://your-app.railway.app EXPORT_SECRET=photoday-export-2024 node scripts/import-from-railway.mjs
 *
 * Or set them in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env ─────────────────────────────────
function loadEnv() {
    const envPath = join(__dirname, '..', '.env.local');
    if (!existsSync(envPath)) return;
    const raw = readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && !k.startsWith('#') && !process.env[k.trim()]) {
            process.env[k.trim()] = v.join('=').trim();
        }
    });
}

loadEnv();

const RAILWAY_URL = process.env.RAILWAY_URL;
const EXPORT_SECRET = process.env.EXPORT_SECRET || 'photoday-export-2024';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!RAILWAY_URL) {
    console.error('❌ Set RAILWAY_URL=https://your-railway-app-url.railway.app');
    process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── Helpers ───────────────────────────────────
async function upsertBatch(table, rows, conflictCol = 'id', chunkSize = 100) {
    if (!rows || rows.length === 0) { console.log(`  ⏭  ${table}: 0 rows (empty)`); return; }
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await sb.from(table).upsert(chunk, { onConflict: conflictCol });
        if (error) {
            console.error(`  ❌ ${table} chunk ${i}: ${error.message}`);
            throw error;
        }
    }
    console.log(`  ✓ ${table}: ${rows.length} rows imported`);
}

// ── Main ──────────────────────────────────────
async function run() {
    console.log(`\n🚀 Fetching data from Railway: ${RAILWAY_URL}\n`);

    const exportUrl = `${RAILWAY_URL}/api/admin/export?secret=${EXPORT_SECRET}`;
    const res = await fetch(exportUrl);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Railway export failed: ${res.status} — ${text.slice(0, 200)}`);
    }

    const { data, summary } = await res.json();

    console.log('📊 Railway data summary:');
    for (const [table, count] of Object.entries(summary)) {
        if (count > 0) console.log(`   ${table}: ${count} rows`);
    }
    console.log();

    // 1. Users (no password_hash changes — preserve existing passwords)
    await upsertBatch('users', data.users?.map(u => ({
        id: u.id, username: u.username, email: u.email,
        password_hash: u.password_hash, display_name: u.display_name,
        bio: u.bio || '', avatar_path: u.avatar_path || null,
        created_at: u.created_at,
    })));

    // 2. Entries
    await upsertBatch('entries', data.entries?.map(e => ({
        id: e.id, user_id: e.user_id, date: e.date,
        photo_path: e.photo_path || null, description: e.description || '',
        mood: e.mood || '', privacy: e.privacy || 'private',
        created_at: e.created_at, updated_at: e.updated_at,
        deleted_at: e.deleted_at || null,
    })));

    // 3. Friendships
    await upsertBatch('friendships', data.friendships?.map(f => ({
        id: f.id, requester_id: f.requester_id, receiver_id: f.receiver_id,
        status: f.status, created_at: f.created_at,
    })));

    // 4. Reactions
    await upsertBatch('reactions', data.reactions?.map(r => ({
        id: r.id, user_id: r.user_id, entry_id: r.entry_id,
        type: r.type || 'like', created_at: r.created_at,
    })));

    // 5. Notifications
    await upsertBatch('notifications', data.notifications?.map(n => ({
        id: n.id, user_id: n.user_id, actor_id: n.actor_id,
        type: n.type, entity_id: n.entity_id || null,
        is_read: n.is_read || 0, created_at: n.created_at,
    })));

    // 6. Albums
    await upsertBatch('albums', data.albums?.map(a => ({
        id: a.id, user_id: a.user_id, name: a.name,
        description: a.description || '', cover_path: a.cover_path || null,
        created_at: a.created_at,
    })));

    // 7. Album entries (composite PK)
    await upsertBatch('album_entries', data.album_entries?.map(ae => ({
        album_id: ae.album_id, entry_id: ae.entry_id, added_at: ae.added_at,
    })), 'album_id,entry_id');

    // 8. Posts
    await upsertBatch('posts', data.posts?.map(p => ({
        id: p.id, user_id: p.user_id, entry_id: p.entry_id || null,
        photo_path: p.photo_path || null, caption: p.caption || '',
        privacy: p.privacy || 'friends', created_at: p.created_at,
    })));

    // 9. Comments
    await upsertBatch('comments', data.comments?.map(c => ({
        id: c.id, post_id: c.post_id, user_id: c.user_id,
        text: c.text, created_at: c.created_at,
    })));

    // 10. Stories
    await upsertBatch('stories', data.stories?.map(s => ({
        id: s.id, user_id: s.user_id, photo_path: s.photo_path,
        caption: s.caption || '', privacy: s.privacy || 'friends',
        expires_at: s.expires_at, created_at: s.created_at,
    })));

    // 11. Story views
    await upsertBatch('story_views', data.story_views?.map(sv => ({
        story_id: sv.story_id, viewer_id: sv.viewer_id, viewed_at: sv.viewed_at,
    })), 'story_id,viewer_id');

    // 12. Conversations (enforce user_a < user_b)
    const convs = data.conversations?.map(c => {
        const ua = Math.min(c.user_a, c.user_b);
        const ub = Math.max(c.user_a, c.user_b);
        return { id: c.id, user_a: ua, user_b: ub, last_message_at: c.last_message_at };
    });
    await upsertBatch('conversations', convs);

    // 13. Messages
    await upsertBatch('messages', data.messages?.map(m => ({
        id: m.id, conversation_id: m.conversation_id,
        sender_id: m.sender_id, text: m.text || '',
        photo_path: m.photo_path || null, is_read: m.is_read || 0,
        created_at: m.created_at,
    })));

    console.log('\n✅ Import complete! All Railway data is now in Supabase.');
    console.log('\n📝 Next steps:');
    console.log('  1. Verify data in Supabase Table Editor');
    console.log('  2. Upload photos from Railway /uploads to Supabase Storage (see storage-upload.mjs)');
    console.log('  3. Remove /api/admin/export route from Railway (delete server/routes/admin.js)');
}

run().catch(err => {
    console.error('\n❌ Import failed:', err.message);
    process.exit(1);
});
