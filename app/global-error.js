'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body style={{ backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#fff', padding: '24px', fontFamily: 'sans-serif' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#d45113' }}>Wystąpił błąd aplikacji</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                        Niestety coś poszło nie tak podczas wczytywania aplikacji. Spróbuj odświeżyć stronę.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '12px 24px', background: '#d45113', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Odśwież nową sesję
                    </button>
                </div>
            </body>
        </html>
    );
}
