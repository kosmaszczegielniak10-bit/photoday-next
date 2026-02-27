'use client';
// app/providers.js — Client-side provider wrappers (must be a Client Component)

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children, initialUser }) {
    return (
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <AuthProvider initialUser={initialUser}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
