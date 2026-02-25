'use client';
// app/auth/page.js — Login / Register Screen

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import styles from './auth.module.css';

export default function AuthPage() {
    const [mode, setMode] = useState('login');   // 'login' | 'register'
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' });

    const { login, register } = useAuth();
    const showToast = useToast();
    const router = useRouter();

    const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(form.email, form.password);
            } else {
                if (!form.username || !form.displayName) throw new Error('Uzupełnij wszystkie pola');
                await register(form);
            }
            router.replace('/app');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Hero gradient */}
            <div className={styles.hero}>
                <div className={styles.appIcon}>📅</div>
                <h1 className={styles.appName}>PhotoDay</h1>
                <p className={styles.tagline}>Twój prywatny dziennik fotograficzny</p>
            </div>

            {/* Card */}
            <div className={styles.card}>
                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                        onClick={() => setMode('login')}
                        type="button"
                    >
                        Zaloguj się
                    </button>
                    <button
                        className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
                        onClick={() => setMode('register')}
                        type="button"
                    >
                        Zarejestruj się
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Imię / pseudonim</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="np. Jan Kowalski"
                                    value={form.displayName}
                                    onChange={update('displayName')}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Nazwa użytkownika</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="@username"
                                    value={form.username}
                                    onChange={update('username')}
                                    required
                                    autoCapitalize="none"
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="email@example.com"
                            value={form.email}
                            onChange={update('email')}
                            required
                            autoCapitalize="none"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Hasło</label>
                        <input
                            className="input"
                            type="password"
                            placeholder={mode === 'register' ? 'Minimum 6 znaków' : '••••••••'}
                            value={form.password}
                            onChange={update('password')}
                            required
                            minLength={mode === 'register' ? 6 : 1}
                        />
                    </div>

                    <button type="submit" className={`btn btn-primary btn-full ${styles.submitBtn}`} disabled={loading}>
                        {loading ? 'Ładowanie…' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
                    </button>
                </form>
            </div>
        </div>
    );
}
