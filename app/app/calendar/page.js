'use client';
// app/app/calendar/page.js — Calendar / Journal view
// NOTE: Full photo-diary calendar — porting logic from js/views/calendar.js

import { useState, useEffect, useCallback } from 'react';
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
                <div style={{ display: 'flex', gap: 12 }}>
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

            {/* Selected day detail */}
            {selected && (
                <div className={styles.dayDetail}>
                    <div className={styles.dayDetailHeader}>
                        <span className={styles.dayDetailDate}>{selected}</span>
                        <button
                            className={`btn btn-primary`}
                            style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={() => router.push(`/app/capture?date=${selected}`)}
                        >
                            {entry ? 'Edytuj' : '+ Dodaj'}
                        </button>
                    </div>
                    {entry ? (
                        <div className={styles.entryPreview}>
                            {entry.photo_path && (
                                <img
                                    src={getStorageUrl(entry.photo_path)}
                                    alt=""
                                    className={styles.entryPhoto}
                                />
                            )}
                            {entry.description && <p className={styles.entryDesc}>{entry.description}</p>}
                            {entry.mood && <span className={styles.moodTag}>{entry.mood}</span>}
                        </div>
                    ) : (
                        <p className={styles.noEntry}>Brak wpisu na ten dzień. Dodaj swoje pierwsze zdjęcie!</p>
                    )}
                </div>
            )}
        </div>
    );
}
