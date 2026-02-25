'use client';
// components/ui/Toast.js — Global toast notification system

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const showToast = useCallback((message, type = 'info', duration = 3200) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
        return id;
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container} aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
                        {t.type === 'success' && <span className={styles.icon}>✓</span>}
                        {t.type === 'error' && <span className={styles.icon}>✕</span>}
                        {t.type === 'info' && <span className={styles.icon}>ℹ</span>}
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx.showToast;
}
