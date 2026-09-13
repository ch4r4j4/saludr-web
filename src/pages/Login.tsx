import { useState } from 'react';
import { supabase } from '../lib/supabase';

const DOWNLOAD_URL = 'https://drive.google.com/drive/folders/18i6YyWVdLscqkQrWkLyJMcQgIN9FROPD';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.logo}>🏥</div>
        <h1 style={styles.title}>Campañas de Salud</h1>
        <p style={styles.subtitle}>Panel del organizador</p>

        <div style={styles.divider} />

        <p style={styles.desc}>
          Crea y gestiona tus campañas de salud. Agrega áreas, médicos
          y genera el código de acceso para tu equipo.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{ ...styles.googleBtn, opacity: loading ? 0.6 : 1 }}
          onClick={handleGoogle}
          disabled={loading}
        >
          <span style={styles.googleG}>G</span>
          {loading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div style={styles.divider} />

        <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" style={styles.downloadBtn}>
          💻 Descargar app de escritorio
        </a>
        <p style={styles.downloadHint}>
          Para inscribir pacientes en campo (Windows)
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh', display: 'flex',
    justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    padding: 24,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: 48,
    maxWidth: 420, width: '100%', textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  logo: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 800, color: '#1E3A8A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#3B82F6', marginBottom: 0 },
  divider: { height: 1, background: '#E5E7EB', margin: '24px 0' },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 },
  error: {
    background: '#FEE2E2', color: '#DC2626', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, width: '100%', padding: '14px 20px',
    background: '#fff', border: '1.5px solid #E5E7EB',
    borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#374151',
    cursor: 'pointer',
  },
  googleG: { fontSize: 18, fontWeight: 800, color: '#EA4335' },
  downloadBtn: {
    display: 'block', width: '100%', padding: '13px 20px',
    background: '#1E3A8A', color: '#fff', borderRadius: 12,
    fontSize: 15, fontWeight: 700, textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(30,58,138,0.3)',
  },
  downloadHint: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
};
