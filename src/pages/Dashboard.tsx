import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../types';

interface Props { user: User; }

export default function Dashboard({ user }: Props) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar campaña? Se borrarán todas sus áreas y médicos.')) return;
    await supabase.from('campaigns').delete().eq('id', id);
    loadCampaigns();
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <div>
            <h1 style={styles.headerTitle}>Campañas de Salud</h1>
            <p style={styles.headerSub}>Hola, {user.user_metadata?.name ?? user.email}</p>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <div style={styles.topRow}>
          <h2 style={styles.sectionTitle}>Mis campañas ({campaigns.length})</h2>
          <button style={styles.createBtn} onClick={() => navigate('/campaigns/new')}>
            + Nueva Campaña
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 60 }}>Cargando...</p>
        ) : campaigns.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 52 }}>📋</span>
            <p style={styles.emptyTitle}>No hay campañas aún</p>
            <p style={styles.emptySub}>Crea tu primera campaña para empezar</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {campaigns.map(c => (
              <div key={c.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.statusDot, background: c.is_active ? '#10B981' : '#9CA3AF' }} />
                  <h3 style={styles.cardTitle}>{c.name}</h3>
                  {c.is_active && <span style={styles.activeBadge}>ACTIVA</span>}
                </div>

                {c.description && <p style={styles.cardDesc}>{c.description}</p>}
                {c.location && <p style={styles.cardMeta}>📍 {c.location}</p>}
                <p style={styles.cardMeta}>
                  📅 {new Date(c.start_date).toLocaleDateString('es-PE')} →{' '}
                  {new Date(c.end_date).toLocaleDateString('es-PE')}
                </p>

                {/* Código de acceso */}
                <div style={styles.codeBox}>
                  <div style={styles.codeRow}>
                    <span style={styles.codeLabel}>Código</span>
                    <span style={styles.codeValue}>{c.access_code}</span>
                  </div>
                  <div style={styles.codeRow}>
                    <span style={styles.codeLabel}>Contraseña</span>
                    <span style={styles.codeValue}>{c.access_password}</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button style={styles.detailBtn} onClick={() => navigate(`/campaigns/${c.id}`)}>
                    Ver detalle →
                  </button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(c.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#F8FAFC' },
  header: {
    background: '#1E3A8A', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 800, color: '#fff' },
  headerSub: { fontSize: 13, color: '#93C5FD', marginTop: 2 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', borderRadius: 8, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: '#1F2937' },
  createBtn: {
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#111', flex: 1 },
  activeBadge: {
    background: '#D1FAE5', color: '#065F46',
    fontSize: 10, fontWeight: 700, borderRadius: 6,
    padding: '2px 8px',
  },
  cardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  cardMeta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  codeBox: {
    background: '#F8FAFC', borderRadius: 10, padding: 12,
    marginTop: 12, marginBottom: 14, border: '1px solid #E5E7EB',
  },
  codeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  codeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: 600 },
  codeValue: { fontSize: 14, fontWeight: 700, color: '#1E3A8A', fontFamily: 'monospace' },
  cardActions: { display: 'flex', gap: 8, marginTop: 4 },
  detailBtn: {
    flex: 1, background: '#EFF6FF', color: '#2563EB',
    border: 'none', borderRadius: 8, padding: '8px 12px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  deleteBtn: {
    background: '#FEE2E2', border: 'none', borderRadius: 8,
    padding: '8px 12px', fontSize: 16, cursor: 'pointer',
  },
  empty: { textAlign: 'center', paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
};
