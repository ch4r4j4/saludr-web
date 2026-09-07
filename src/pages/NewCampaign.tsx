import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function NewCampaign() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function validate(): string | null {
    if (!name.trim()) return 'El nombre es obligatorio';
    if (!startDate) return 'La fecha de inicio es obligatoria';
    if (!endDate) return 'La fecha de fin es obligatoria';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'La fecha de fin no puede ser antes del inicio';
    if (diff > 5) return 'La campaña no puede durar más de 5 días';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('No hay sesión activa'); setSaving(false); return; }

    const { data, error: dbErr } = await supabase.from('campaigns').insert({
      organizer_id: user.id,
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      start_date: startDate,
      end_date: endDate,
      access_code: generateCode(),
      access_password: generateCode(4),
      is_active: true,
    }).select().single();

    if (dbErr) { setError(dbErr.message); setSaving(false); return; }
    navigate(`/campaigns/${data.id}`);
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Volver</button>
        <h1 style={styles.title}>Nueva Campaña</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Nombre *</label>
          <input style={styles.input} value={name} onChange={e => setName(e.target.value)}
            placeholder="Ej: Campaña de Salud 2026" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Descripción</label>
          <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Descripción breve..." />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Ubicación</label>
          <input style={styles.input} value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ej: Av. Principal 123, Lima" />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Fecha inicio *</label>
            <input style={styles.input} type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Fecha fin * (máx 5 días)</label>
            <input style={styles.input} type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <button
          style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
          onClick={handleSave} disabled={saving}
        >
          {saving ? 'Guardando...' : '✓ Crear Campaña'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh', background: '#F8FAFC',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    padding: '40px 24px',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: 40,
    maxWidth: 600, width: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  back: {
    background: 'none', border: 'none', color: '#2563EB',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 800, color: '#1E3A8A', marginBottom: 24 },
  error: {
    background: '#FEE2E2', color: '#DC2626', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  field: { marginBottom: 18, display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 10,
    fontSize: 15, color: '#111', background: '#F9FAFB', outline: 'none',
    width: '100%',
  },
  row: { display: 'flex', gap: 16 },
  saveBtn: {
    width: '100%', background: '#2563EB', color: '#fff',
    border: 'none', borderRadius: 12, padding: '14px 20px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8,
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
  },
};
