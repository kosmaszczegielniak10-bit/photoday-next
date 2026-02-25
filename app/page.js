'use client';
// app/page.js — Entry point: redirects to /app if logged in, else /auth

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/app' : '/auth');
    }
  }, [user, loading, router]);

  // Splash screen
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      gap: 16,
    }}>
      <img src="/logo.svg" alt="PhotoDay Logo" style={{ width: 120, height: 120 }} />
      <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>PhotoDay</div>
    </div>
  );
}
