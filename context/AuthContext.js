'use client';
// context/AuthContext.js — Global auth state

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from HTTP-only cookie on mount via /api/auth/me
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(u => setUser(u || null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd logowania');
        setUser(data.user);
        return data.user;
    }, []);

    const register = useCallback(async ({ email, username, displayName, password }) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, displayName, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd rejestracji');
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
        window.location.href = '/auth';
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
