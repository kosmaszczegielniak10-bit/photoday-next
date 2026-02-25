#!/bin/bash
# scripts/migrate-photos.sh
# Downloads all photos from Railway /uploads/ and uploads to Supabase Storage
# Usage: bash scripts/migrate-photos.sh

set -e

RAILWAY_URL="https://photoday-kosma-production.up.railway.app"
SECRET="photoday-export-2024"
ENV_FILE="$(dirname "$0")/../.env.local"

# Load env
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    export "$key"="$value"
  done < "$ENV_FILE"
fi

SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
SB_KEY="$SUPABASE_SERVICE_ROLE_KEY"
STORAGE_URL="${SUPABASE_URL}/storage/v1"
BUCKET="uploads"

echo "📋 Fetching file list from Railway..."
FILES_JSON=$(curl -sf "${RAILWAY_URL}/api/admin/files?secret=${SECRET}")
FILE_COUNT=$(echo "$FILES_JSON" | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).count.toString()))")
echo "   Found $FILE_COUNT files"
echo ""

# Create bucket if it doesn't exist (ignore error if exists)
echo "🪣 Ensuring Supabase Storage bucket '$BUCKET' exists..."
curl -sf -X POST "${STORAGE_URL}/bucket" \
  -H "apikey: ${SB_KEY}" \
  -H "Authorization: Bearer ${SB_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${BUCKET}\",\"name\":\"${BUCKET}\",\"public\":true}" \
  > /dev/null 2>&1 || true
echo "   OK"
echo ""

# Download each file from Railway and upload it to Supabase Storage
echo "📸 Downloading and uploading photos..."
SUCCESS=0
FAIL=0

echo "$FILES_JSON" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const { files } = JSON.parse(chunks.join(''));
  files.forEach(f => process.stdout.write(f.path + '\n'));
});
" | while IFS= read -r FILEPATH; do
  [ -z "$FILEPATH" ] && continue

  TMP="/tmp/railway_photo_$(echo "$FILEPATH" | tr '/' '_')"

  # Download from Railway
  HTTP=$(curl -s -o "$TMP" -w "%{http_code}" \
    "${RAILWAY_URL}/api/admin/file/${FILEPATH}?secret=${SECRET}")

  if [ "$HTTP" != "200" ]; then
    echo "  ⚠  skip (download $HTTP): $FILEPATH"
    rm -f "$TMP"
    continue
  fi

  # Detect mime type
  MIME=$(file --mime-type -b "$TMP" 2>/dev/null || echo "application/octet-stream")

  # Upload to Supabase Storage
  HTTP2=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${STORAGE_URL}/object/${BUCKET}/${FILEPATH}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Content-Type: ${MIME}" \
    -H "x-upsert: true" \
    --data-binary "@${TMP}")

  rm -f "$TMP"

  if [ "$HTTP2" = "200" ] || [ "$HTTP2" = "200" ]; then
    echo "  ✓ $FILEPATH"
  else
    echo "  ❌ $FILEPATH (HTTP $HTTP2)"
  fi
done

echo ""
echo "✅ Photo migration complete!"
echo ""
echo "🔗 Now update photo_path in DB to Supabase public URLs."
echo "   Run in Supabase SQL Editor:"
echo ""
echo "UPDATE entries SET photo_path = '${SUPABASE_URL}/storage/v1/object/public/uploads/' || LTRIM(photo_path, '/uploads/')"
echo "WHERE photo_path LIKE '/uploads/%';"
echo ""
echo "UPDATE albums SET cover_path = '${SUPABASE_URL}/storage/v1/object/public/uploads/' || LTRIM(cover_path, '/uploads/')"
echo "WHERE cover_path LIKE '/uploads/%';"
echo ""
echo "UPDATE users SET avatar_path = '${SUPABASE_URL}/storage/v1/object/public/uploads/' || LTRIM(avatar_path, '/uploads/')"
echo "WHERE avatar_path LIKE '/uploads/%';"
