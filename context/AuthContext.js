'use client';
// context/AuthContext.js — Global auth state

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'photoday_token';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from token (or HTTP-only cookie) on mount
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        fetch('/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => r.ok ? r.json() : null)
            .then(u => {
                if (u) {
                    setUser(u);
                } else {
                    localStorage.removeItem(TOKEN_KEY);
                    setUser(null);
                }
            })
            .catch(() => { localStorage.removeItem(TOKEN_KEY); })
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
        localStorage.setItem(TOKEN_KEY, data.token);
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
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    }, []);

    const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}
