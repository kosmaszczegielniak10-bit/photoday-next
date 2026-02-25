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
      background: 'linear-gradient(135deg, #f97316, #ec4899)',
      gap: 12,
    }}>
      <div style={{ fontSize: 48 }}>📅</div>
      <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>PhotoDay</div>
    </div>
  );
}
