// lib/api.js — Typed API client for Next.js frontend
// Wraps fetch with base URL. Auth uses httpOnly cookies automatically.

async function request(method, path, body) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    const res = await fetch(`/api${path}`, opts);
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

export const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
};
