// lib/auth.js — bcrypt + JWT auth utilities (ported from server/auth.js)
// Used by Next.js API Route handlers. Never import this in client components.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';
const COOKIE_NAME = 'photoday_token';

// ── Hashing ───────────────────────────────────

export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// ── JWT ───────────────────────────────────────

export function signToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '90d' });
}

export function verifyToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return { userId: payload.userId };
    } catch {
        return null;
    }
}

// ── Cookie helpers ────────────────────────────

export async function getTokenFromCookies() {
    const jar = await cookies();
    return jar.get(COOKIE_NAME)?.value ?? null;
}

export function setAuthCookie(res, token) {
    res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: '/',
    });
}

export function clearAuthCookie(res) {
    res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
}

// ── Auth guard (for API routes) ───────────────

export async function requireAuth(request) {
    // 1. Try Authorization header (Bearer token) — kept for compatibility with old frontend
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payload = verifyToken(token);
        if (payload) return payload.userId;
    }

    // 2. Try HttpOnly cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (match) {
        const payload = verifyToken(match[1]);
        if (payload) return payload.userId;
    }

    return null;
}
