'use client';
// app/app/calendar/page.js — Calendar / Journal view
// NOTE: Full photo-diary calendar — porting logic from js/views/calendar.js

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { getStorageUrl } from '@/lib/storage';
import styles from './calendar.module.css';

const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
    const today = new Date();
    const [view, setView] = useState('month');   // 'month' | 'albums'
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [entries, setEntries] = useState({});   // map: dateStr → entry
    const [selected, setSelected] = useState(null); // dateStr selected
    const [entry, setEntry] = useState(null); // entry for selected date
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ streak: 0, total: 0 });

    const showToast = useToast();
    const router = useRouter();

    const loadMonth = useCallback(async (y, m) => {
        setLoading(true);
        try {
            const data = await api.get(`/entries?year=${y}&month=${m + 1}`);
            const map = {};
            data.forEach(e => { if (!e.deleted_at) map[e.date] = e; });
            setEntries(prev => ({ ...prev, ...map }));
        } catch (err) {
            showToast('Błąd ładowania wpisów', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadMonth(year, month); }, [year, month, loadMonth]);
    useEffect(() => { api.get('/profile/stats').then(setStats).catch(() => { }); }, []);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };

    // Build calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday-first
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

    const handleDayClick = async (d) => {
        if (!d) return;
        const key = formatDateKey(new Date(year, month, d));
        setSelected(key);
        if (entries[key]) {
            setEntry(entries[key]);
        } else {
            setEntry(null);
        }
    };

    return (
        <div className={styles.page}>
            {/* Month navigation as Header */}
            <div className={styles.monthNav}>
                <h2 className={styles.monthTitle}>{MONTHS_PL[month]} {year}</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-glass)', padding: '6px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 13, color: 'var(--accent-orange)' }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11.64 1.48a1 1 0 011.69 0l1.24 1.83a8 8 0 003.56 3.55l1.63 1.25a1 1 0 01.44 1.1A8.96 8.96 0 0112 21a8.96 8.96 0 01-8.2-11.77 1 1 0 01.44-1.1l1.63-1.25a8 8 0 003.56-3.55l1.21-1.85z" /></svg>
                        {stats?.streak || 0} Dni
                    </div>
                    <button className={styles.navArrow} onClick={prevMonth} aria-label="Poprzedni miesiąc">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button className={styles.navArrow} onClick={nextMonth} aria-label="Następny miesiąc">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
            </div>

            {/* Segmented control */}
            <div className={styles.segControl}>
                <button
                    className={`${styles.seg} ${view === 'month' ? styles.segActive : ''}`}
                    onClick={() => setView('month')}
                >Kalendarz</button>
                <button
                    className={`${styles.seg} ${view === 'albums' ? styles.segActive : ''}`}
                    onClick={() => { setView('albums'); router.push('/app/albums'); }}
                >Albumy</button>
            </div>

            {/* Day-of-week headers */}
            <div className={styles.grid}>
                {DAYS_PL.map(d => (
                    <div key={d} className={styles.dayHeader}>{d}</div>
                ))}

                {/* Calendar cells */}
                {cells.map((d, i) => {
                    if (!d) return <div key={`empty-${i}`} />;
                    const key = formatDateKey(new Date(year, month, d));
                    const e = entries[key];
                    const isToday = formatDateKey(today) === key;
                    const isSel = selected === key;

                    return (
                        <button
                            key={key}
                            className={`${styles.cell} ${isToday ? styles.cellToday : ''} ${isSel ? styles.cellSelected : ''} ${e ? styles.cellHasEntry : ''}`}
                            onClick={() => handleDayClick(d)}
                        >
                            {e?.photo_path ? (
                                <img
                                    src={getStorageUrl(e.photo_path)}
                                    alt=""
                                    className={styles.cellThumb}
                                    loading="lazy"
                                />
                            ) : null}
                            <span className={styles.cellDay}>{d}</span>
                            {e && <div className={styles.cellDot} />}
                        </button>
                    );
                })}
            </div>

            {/* Selected day detail (Bottom Sheet Modal) */}
            {selected && (
                <>
                    <div className="backdrop fade-in" onClick={() => setSelected(null)} />
                    <div className="bottom-sheet slide-up" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}>
                        <div className="sheet-handle" onClick={() => setSelected(null)} />

                        <div className="sheet-header" style={{ padding: '0 20px 14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                            <div className="sheet-title" style={{ fontSize: 18 }}>{selected}</div>
                        </div>

                        {entry ? (
                            <div className={styles.entryPreview} style={{ padding: '0 20px' }}>
                                {entry.photo_path && (
                                    <div style={{ position: 'relative', width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                        <Image
                                            src={getStorageUrl(entry.photo_path)}
                                            alt=""
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            unoptimized
                                        />
                                    </div>
                                )}
                                {entry.description && <p className={styles.entryDesc} style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)' }}>{entry.description}</p>}
                                {entry.mood && <span className={styles.moodTag} style={{ fontSize: 14, padding: '6px 14px', background: 'var(--bg-secondary)', marginTop: 12 }}>{entry.mood}</span>}

                                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={() => router.push(`/app/capture?date=${selected}`)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        Edytuj
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getStorageUrl(entry.photo_path);
                                        link.download = `photoday-${selected}.jpg`;
                                        link.target = '_blank';
                                        link.click();
                                    }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        Zapisz
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '20px 20px 40px', textAlign: 'center' }}>
                                <p className={styles.noEntry} style={{ fontSize: 15, marginBottom: 20 }}>Brak wpisu na ten dzień. Dodaj swoje pierwsze zdjęcie!</p>
                                <button className="btn btn-primary btn-full transition-all" onClick={() => router.push(`/app/capture?date=${selected}`)}>
                                    + Dodaj wpis
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
