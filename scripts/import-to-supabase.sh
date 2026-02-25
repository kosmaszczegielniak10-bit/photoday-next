#!/bin/bash
# import-to-supabase.sh — Posts Railway data directly to Supabase REST API
# Usage: bash scripts/import-to-supabase.sh
# Requires: /tmp/railway-export.json (already downloaded)

set -e

# Load from .env.local
ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs) 2>/dev/null || true
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
KEY="${SUPABASE_SERVICE_ROLE_KEY}"
JSON_FILE="/tmp/railway-export.json"

if [ -z "$SUPABASE_URL" ] || [ -z "$KEY" ]; then
  echo "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

if [ ! -f "$JSON_FILE" ]; then
  echo "❌ $JSON_FILE not found. Download it first."
  exit 1
fi

echo "🚀 Importing Railway data → Supabase"
echo "   URL: $SUPABASE_URL"
echo ""

# Helper: upsert a table
upsert() {
  local TABLE="$1"
  local DATA="$2"
  local COUNT
  COUNT=$(echo "$DATA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));process.stdout.write(String(d.length))")
  
  if [ "$COUNT" = "0" ]; then
    echo "  ⏭  $TABLE: 0 rows"
    return
  fi

  HTTP_CODE=$(echo "$DATA" | curl -s -o /tmp/sb-resp.json -w "%{http_code}" \
    -X POST "${SUPABASE_URL}/rest/v1/${TABLE}" \
    -H "apikey: ${KEY}" \
    -H "Authorization: Bearer ${KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=minimal" \
    --data-binary @-)

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "  ✓ $TABLE: $COUNT rows (HTTP $HTTP_CODE)"
  else
    echo "  ❌ $TABLE: HTTP $HTTP_CODE"
    cat /tmp/sb-resp.json
    echo ""
  fi
}

# Extract each table from JSON and transform columns
node - <<'EOF'
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('/tmp/railway-export.json','utf8'));
const d = raw.data;

const out = {
  users: (d.users||[]).map(u=>({id:u.id,username:u.username,email:u.email,password_hash:u.password_hash,display_name:u.display_name,bio:u.bio||'',avatar_path:u.avatar_path||null,created_at:u.created_at})),
  entries: (d.entries||[]).map(e=>({id:e.id,user_id:e.user_id,date:e.date,photo_path:e.photo_path||null,description:e.description||'',mood:e.mood||'',privacy:e.privacy||'private',created_at:e.created_at,updated_at:e.updated_at,deleted_at:e.deleted_at||null})),
  friendships: (d.friendships||[]).map(f=>({id:f.id,requester_id:f.requester_id,receiver_id:f.receiver_id,status:f.status,created_at:f.created_at})),
  reactions: (d.reactions||[]).map(r=>({id:r.id,user_id:r.user_id,entry_id:r.entry_id,type:r.type||'like',created_at:r.created_at})),
  notifications: (d.notifications||[]).map(n=>({id:n.id,user_id:n.user_id,actor_id:n.actor_id,type:n.type,entity_id:n.entity_id||null,is_read:n.is_read||0,created_at:n.created_at})),
  albums: (d.albums||[]).map(a=>({id:a.id,user_id:a.user_id,name:a.title||a.name||'Album',description:a.description||'',cover_path:a.cover_photo_path||a.cover_path||null,created_at:a.created_at})),
  album_entries: (d.album_entries||[]).map(ae=>({album_id:ae.album_id,entry_id:ae.entry_id,added_at:ae.added_at})),
  posts: (d.posts||[]).map(p=>({id:p.id,user_id:p.user_id,entry_id:p.entry_id||null,photo_path:p.photo_path||null,caption:p.caption||'',privacy:p.privacy||'friends',created_at:p.created_at})),
  comments: (d.comments||[]).map(c=>({id:c.id,post_id:c.post_id,user_id:c.user_id,text:c.text,created_at:c.created_at})),
  conversations: (d.conversations||[]).map(c=>({id:c.id,user_a:Math.min(c.user_a,c.user_b),user_b:Math.max(c.user_a,c.user_b),last_message_at:c.last_message_at})),
  messages: (d.messages||[]).map(m=>({id:m.id,conversation_id:m.conversation_id,sender_id:m.sender_id,text:m.text||'',photo_path:m.photo_path||null,is_read:m.is_read||0,created_at:m.created_at})),
};

for(const [k,v] of Object.entries(out)){
  fs.writeFileSync(`/tmp/sb-${k}.json`, JSON.stringify(v));
}
console.log('Tables extracted to /tmp/sb-*.json');
EOF

# Upload each table
for TABLE in users entries friendships reactions notifications albums album_entries posts comments conversations messages; do
  DATA=$(cat "/tmp/sb-${TABLE}.json")
  upsert "$TABLE" "$DATA"
done

echo ""
echo "✅ Import complete! Verify in Supabase Table Editor."
