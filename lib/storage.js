// lib/storage.js — Photo storage utilities for client and server

export function getStorageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Strip leading /uploads/ or uploads/ if it exists from migration
    const cleanPath = path.replace(/^\/?uploads\//, '');
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://drcmantndmqrcwpcezoy.supabase.co';
    return `${baseUrl}/storage/v1/object/public/uploads/${cleanPath}`;
}
