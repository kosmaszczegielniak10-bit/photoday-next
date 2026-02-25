'use client';
// app/app/messages/page.js — Direct Messages with Supabase Realtime

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { getStorageUrl } from '@/lib/storage';
import styles from './messages.module.css';

export default function MessagesPage() {
    const { user } = useAuth();
    const showToast = useToast();
    const [view, setView] = useState('list'); // 'list' | 'chat'
    const [conversations, setConvs] = useState(null);
    const [partner, setPartner] = useState(null); // { id, name, avatar }
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [convId, setConvId] = useState(null);
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);

    // Load conversations
    useEffect(() => {
        if (view !== 'list') return;
        api.get('/messages').then(setConvs).catch(() => setConvs([]));
    }, [view]);

    // Realtime subscription to new messages
    useEffect(() => {
        if (!convId) return;

        // Subscribe to new messages in this conversation
        const channel = supabase
            .channel(`conv-${convId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${convId}`,
            }, (payload) => {
                const msg = payload.new;
                if (msg.sender_id !== user?.id) {
                    setMessages(prev => [...prev, msg]);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                }
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [convId, user?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const openChat = useCallback(async (partnerId, partnerName, partnerAvatar) => {
        setPartner({ id: partnerId, name: partnerName, avatar: partnerAvatar });
        setView('chat');
        setMessages([]);
        try {
            const data = await api.get(`/messages/${partnerId}`);
            setMessages(data.messages || []);
            setConvId(data.conversationId);
        } catch { showToast('Błąd ładowania wiadomości', 'error'); }
    }, [showToast]);

    const sendMessage = useCallback(async () => {
        const text = inputText.trim();
        if (!text || sending) return;
        setSending(true);
        setInputText('');

        // Optimistic UI
        const temp = { id: `temp-${Date.now()}`, sender_id: user?.id, text, created_at: Date.now() };
        setMessages(prev => [...prev, temp]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);

        try {
            const msg = await api.post(`/messages/${partner.id}`, { text });
            setMessages(prev => prev.map(m => m.id === temp.id ? { ...msg, id: msg.id } : m));
        } catch {
            showToast('Błąd wysyłania', 'error');
            setMessages(prev => prev.filter(m => m.id !== temp.id));
            setInputText(text);
        } finally {
            setSending(false);
        }
    }, [inputText, sending, user?.id, partner, showToast]);

    const openNewChat = async () => {
        try {
            const friends = await api.get('/friends');
            if (!friends.length) { showToast('Brak znajomych', 'info'); return; }
            // Show a quick friend picker (simple prompt for now)
            // TODO: Replace with a proper modal component
            const f = friends[0];
            openChat(f.id, f.display_name || f.username, f.avatar_path);
        } catch { showToast('Błąd', 'error'); }
    };

    if (view === 'chat' && partner) {
        return (
            <div className={styles.chatPage}>
                <div className={styles.chatHeader}>
                    <button className={styles.backBtn} onClick={() => { setView('list'); setConvId(null); if (channelRef.current) supabase.removeChannel(channelRef.current); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    {partner.avatar && (
                        <img src={getStorageUrl(partner.avatar)} alt="" className={styles.chatAvatar} />
                    )}
                    <span className={styles.chatName}>{partner.name}</span>
                </div>

                <div className={styles.messages}>
                    {messages.length === 0 && (
                        <div className={styles.emptyChat}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: .3 }}>
                                <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" /><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                            </svg>
                            <span>Zacznij rozmowę!</span>
                        </div>
                    )}
                    {messages.map(m => {
                        const isMine = m.sender_id === user?.id;
                        const t = m.created_at ? new Date(m.created_at).toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit' }) : '';
                        return (
                            <div key={m.id} className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                                <div className={styles.bubbleText}>{m.text}</div>
                                <div className={styles.bubbleTime}>{t}</div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputRow}>
                    <input
                        className={`input ${styles.msgInput}`}
                        placeholder="Wiadomość…"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    />
                    <button className={styles.sendBtn} onClick={sendMessage} disabled={!inputText.trim() || sending}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.listPage}>
            <div className={styles.listHeader}>
                <h1 className={styles.listTitle}>Wiadomości</h1>
                <button className={styles.newChatBtn} onClick={openNewChat} aria-label="Nowa wiadomość">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </button>
            </div>

            {conversations === null ? (
                <div className={styles.skeleton}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '55%', height: 14, borderRadius: 4, marginBottom: 7 }} />
                                <div className="skeleton" style={{ width: '75%', height: 11, borderRadius: 4 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : !Array.isArray(conversations) || conversations.length === 0 ? (
                <div className={styles.empty}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" style={{ opacity: .3 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <div className={styles.emptyTitle}>Brak wiadomości</div>
                    <div className={styles.emptySubtitle}>Napisz do znajomego, aby rozpocząć rozmowę!</div>
                </div>
            ) : (
                <div>
                    {conversations.map(c => {
                        const av = c.avatar_path
                            ? getStorageUrl(c.avatar_path)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.display_name || c.username)}&size=52&background=random&color=fff`;
                        return (
                            <div key={c.partner_id} className={styles.convRow} onClick={() => openChat(c.partner_id, c.display_name || c.username, c.avatar_path)}>
                                <img src={av} alt="" className={styles.convAvatar} />
                                <div className={styles.convInfo}>
                                    <div className={styles.convName}>{c.display_name || c.username}</div>
                                    <div className={styles.convPreview}>{c.last_text || 'Zacznij rozmowę'}</div>
                                </div>
                                {c.unread_count > 0 && <div className={styles.unreadBadge}>{c.unread_count}</div>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
