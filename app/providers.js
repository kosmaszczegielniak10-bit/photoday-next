'use client';
// app/providers.js — Client-side provider wrappers (must be a Client Component)

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children, initialUser }) {
    return (
        <AuthProvider initialUser={initialUser}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </AuthProvider>
    );
}
