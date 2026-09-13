import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Campaign, Area, Doctor } from '../types';

const COLORS = ['#2563EB','#7C3AED','#DC2626','#D97706','#059669','#0891B2','#DB2777','#65A30D'];
const PRESETS = ['Triaje','Odontología','Fisioterapia','Pediatría','Medicina General','Oftalmología','Dermatología','Ginecología','Nutrición','Psicología','Cardiología','Laboratorio','Farmacia'];

type Tab = 'areas' | 'doctors' | 'code';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tab, setTab] = useState<Tab>('areas');
  const [loading, setLoading] = useState(true);

  const [areaName, setAreaName] = useState('');
  const [areaColor, setAreaColor] = useState(COLORS[0]);
  const [savingArea, setSavingArea] = useState(false);

  const [doctorName, setDoctorName] = useState('');
  const [doctorAreaId, setDoctorAreaId] = useState('');
  const [savingDoctor, setSavingDoctor] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [{ data: c }, { data: a }, { data: d }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', id!).single(),
      supabase.from('areas').select('*').eq('campaign_id', id!).order('created_at'),
      supabase.from('doctors').select('*').eq('campaign_id', id!).order('created_at'),
    ]);
    setCampaign(c);
    setAreas(a ?? []);
    setDoctors(d ?? []);
    setLoading(false);
  }

  async function handleAddArea() {
    if (!areaName.trim()) return;
    setSavingArea(true);
    await supabase.from('areas').insert({
      campaign_id: id,
      name: areaName.trim(),
      color: areaColor,
      estimated_minutes_per_patient: 15,
      is_enabled: true,
    });
    setAreaName('');
    await load();
    setSavingArea(false);
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm('¿Eliminar área? También se eliminarán sus médicos.')) return;
    await supabase.from('areas').delete().eq('id', areaId);
    load();
  }

  async function handleAddDoctor() {
    if (!doctorName.trim() || !doctorAreaId) return;
    setSavingDoctor(true);
    await supabase.from('doctors').insert({
      campaign_id: id,
      area_id: doctorAreaId,
      name: doctorName.trim(),
    });
    setDoctorName('');
    await load();
    setSavingDoctor(false);
  }

  async function handleDeleteDoctor(doctorId: string) {
    await supabase.from('doctors').delete().eq('id', doctorId);
    load();
  }

  async function handleToggleArea(area: Area) {
    await supabase.from('areas').update({ is_enabled: !area.is_enabled }).eq('id', area.id);
    load();
  }

  if (loading) return <div style={{ padding: 40, color: '#9CA3AF' }}>Cargando...</div>;
  if (!campaign) return <div style={{ padding: 40, color: '#EF4444' }}>Campaña no encontrada</div>;

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.back} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <div>
            <h1 style={styles.headerTitle}>{campaign.name}</h1>
            <p style={styles.headerSub}>
              📅 {new Date(campaign.start_date).toLocaleDateString('es-PE')} →{' '}
              {new Date(campaign.end_date).toLocaleDateString('es-PE')}
              {campaign.location ? ` · 📍 ${campaign.location}` : ''}
            </p>
          </div>
        </div>
        <div style={{ ...styles.statusBadge, background: campaign.is_active ? '#D1FAE5' : '#F3F4F6' }}>
          <span style={{ color: campaign.is_active ? '#065F46' : '#6B7280', fontSize: 13, fontWeight: 700 }}>
            {campaign.is_active ? '● ACTIVA' : '○ INACTIVA'}
          </span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.tabs}>
          {(['areas', 'doctors', 'code'] as Tab[]).map(t => (
            <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}>
              {t === 'areas' ? `Áreas (${areas.length})` : t === 'doctors' ? `Médicos (${doctors.length})` : '🔑 Código de acceso'}
            </button>
          ))}
        </div>

        {/* ── ÁREAS ── */}
        {tab === 'areas' && (
          <div style={styles.content}>
            <p style={styles.sectionLabel}>Áreas frecuentes</p>
            <div style={styles.presets}>
              {PRESETS.map(p => (
                <button key={p}
                  style={{ ...styles.preset, ...(areaName === p ? styles.presetActive : {}) }}
                  onClick={() => setAreaName(p)}>
                  {p}
                </button>
              ))}
            </div>

            <div style={styles.formRow}>
              <input style={{ ...styles.input, flex: 2 }} value={areaName}
                onChange={e => setAreaName(e.target.value)}
                placeholder="Nombre del área..." />
              <div style={styles.colorPicker}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setAreaColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c,
                      border: 'none', cursor: 'pointer',
                      outline: areaColor === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }} />
                ))}
              </div>
              <button style={{ ...styles.addBtn, opacity: savingArea ? 0.6 : 1 }}
                onClick={handleAddArea} disabled={savingArea}>
                {savingArea ? '...' : '+ Agregar'}
              </button>
            </div>

            {areas.length === 0
              ? <p style={styles.empty}>No hay áreas configuradas</p>
              : areas.map(area => (
                <div key={area.id} style={styles.item}>
                  <div style={{ ...styles.colorDot, background: area.color }} />
                  <div style={{ flex: 1 }}>
                    <span style={styles.itemName}>{area.name}</span>
                    <span style={styles.itemSub}>
                      {doctors.filter(d => d.area_id === area.id).length} médico(s)
                    </span>
                  </div>
                  <button style={styles.toggleBtn} onClick={() => handleToggleArea(area)}>
                    {area.is_enabled ? '✅' : '⬜'}
                  </button>
                  <button style={styles.iconBtn} onClick={() => handleDeleteArea(area.id)}>🗑️</button>
                </div>
              ))
            }
          </div>
        )}

        {/* ── MÉDICOS ── */}
        {tab === 'doctors' && (
          <div style={styles.content}>
            {areas.length === 0 ? (
              <p style={styles.empty}>Primero agrega áreas antes de agregar médicos</p>
            ) : (
              <>
                <div style={styles.formRow}>
                  <input style={{ ...styles.input, flex: 2 }} value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="Nombre del médico..." />
                  <select style={{ ...styles.input, flex: 1 }} value={doctorAreaId}
                    onChange={e => setDoctorAreaId(e.target.value)}>
                    <option value="">Selecciona área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button style={{ ...styles.addBtn, opacity: savingDoctor ? 0.6 : 1 }}
                    onClick={handleAddDoctor} disabled={savingDoctor}>
                    {savingDoctor ? '...' : '+ Agregar'}
                  </button>
                </div>

                {doctors.length === 0
                  ? <p style={styles.empty}>No hay médicos configurados</p>
                  : areas.map(area => {
                    const areaDoctors = doctors.filter(d => d.area_id === area.id);
                    if (areaDoctors.length === 0) return null;
                    return (
                      <div key={area.id} style={{ marginBottom: 20 }}>
                        <div style={styles.areaGroup}>
                          <div style={{ ...styles.colorDot, background: area.color }} />
                          <span style={styles.areaGroupName}>{area.name}</span>
                        </div>
                        {areaDoctors.map(d => (
                          <div key={d.id} style={{ ...styles.item, marginLeft: 24 }}>
                            <span style={{ fontSize: 18, marginRight: 10 }}>👨‍⚕️</span>
                            <span style={{ ...styles.itemName, flex: 1 }}>{d.name}</span>
                            <button style={styles.iconBtn} onClick={() => handleDeleteDoctor(d.id)}>🗑️</button>
                          </div>
                        ))}
                      </div>
                    );
                  })
                }
              </>
            )}
          </div>
        )}

        {/* ── CÓDIGO DE ACCESO ── */}
        {tab === 'code' && (
          <div style={styles.content}>
            <div style={styles.codeCard}>
              <p style={styles.codeTitle}>🔑 Código de acceso para el equipo</p>
              <p style={styles.codeDesc}>
                Comparte estos datos con tu equipo para que puedan acceder
                a la aplicación de escritorio e inscribir pacientes.
              </p>
              <div style={styles.codeBlock}>
                <div style={styles.codeItem}>
                  <span style={styles.codeItemLabel}>Código de campaña</span>
                  <span style={styles.codeItemValue}>{campaign.access_code}</span>
                </div>
                <div style={styles.codeDivider} />
                <div style={styles.codeItem}>
                  <span style={styles.codeItemLabel}>Contraseña</span>
                  <span style={styles.codeItemValue}>{campaign.access_password}</span>
                </div>
              </div>
              <div style={styles.codeSummary}>
                <p style={styles.codeSummaryTitle}>Resumen de la campaña</p>
                <p style={styles.codeSummaryItem}>📋 {campaign.name}</p>
                {campaign.location && <p style={styles.codeSummaryItem}>📍 {campaign.location}</p>}
                <p style={styles.codeSummaryItem}>
                  📅 {new Date(campaign.start_date).toLocaleDateString('es-PE')} →{' '}
                  {new Date(campaign.end_date).toLocaleDateString('es-PE')}
                </p>
                <p style={styles.codeSummaryItem}>🏥 {areas.length} área(s) · {doctors.length} médico(s)</p>
              </div>
              <button style={styles.copyBtn} onClick={() => {
                const text = `Campaña: ${campaign.name}\nCódigo: ${campaign.access_code}\nContraseña: ${campaign.access_password}`;
                navigator.clipboard.writeText(text);
                alert('¡Copiado al portapapeles!');
              }}>
                📋 Copiar datos de acceso
              </button>
            </div>
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
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  back: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#93C5FD', borderRadius: 8, padding: '6px 12px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  headerTitle: { fontSize: 20, fontWeight: 800, color: '#fff' },
  headerSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  statusBadge: { borderRadius: 8, padding: '6px 12px' },
  main: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  tabs: { display: 'flex', borderBottom: '2px solid #E5E7EB', marginBottom: 28 },
  tab: {
    background: 'none', border: 'none', padding: '12px 20px',
    fontSize: 14, fontWeight: 600, color: '#9CA3AF', cursor: 'pointer',
    borderBottom: '2px solid transparent', marginBottom: -2,
  },
  tabActive: { color: '#2563EB', borderBottomColor: '#2563EB' },
  content: {},
  sectionLabel: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 },
  presets: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  preset: {
    background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20,
    padding: '6px 14px', fontSize: 13, color: '#374151', cursor: 'pointer',
  },
  presetActive: { borderColor: '#2563EB', background: '#EFF6FF', color: '#2563EB' },
  formRow: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  input: {
    padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10,
    fontSize: 14, color: '#111', background: '#F9FAFB', outline: 'none',
  },
  colorPicker: { display: 'flex', gap: 6, alignItems: 'center' },
  addBtn: {
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: 10, padding: '10px 18px', fontSize: 14,
    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: 600, color: '#111', display: 'block' },
  itemSub: { fontSize: 12, color: '#9CA3AF', display: 'block', marginTop: 2 },
  toggleBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' },
  areaGroup: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  areaGroupName: { fontSize: 13, fontWeight: 700, color: '#374151' },
  empty: { color: '#9CA3AF', textAlign: 'center', padding: '40px 0', fontSize: 14 },
  codeCard: {
    background: '#fff', borderRadius: 16, padding: 32,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  codeTitle: { fontSize: 20, fontWeight: 800, color: '#1E3A8A', marginBottom: 8 },
  codeDesc: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 },
  codeBlock: {
    background: '#F0F9FF', border: '2px solid #BAE6FD',
    borderRadius: 12, padding: 24, marginBottom: 24,
  },
  codeItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
  codeItemLabel: { fontSize: 13, color: '#0369A1', fontWeight: 600 },
  codeItemValue: { fontSize: 22, fontWeight: 800, color: '#1E3A8A', fontFamily: 'monospace', letterSpacing: 3 },
  codeDivider: { height: 1, background: '#BAE6FD', margin: '12px 0' },
  codeSummary: {
    background: '#F8FAFC', borderRadius: 10, padding: 16,
    marginBottom: 20, border: '1px solid #E5E7EB',
  },
  codeSummaryTitle: { fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 },
  codeSummaryItem: { fontSize: 14, color: '#374151', marginBottom: 4 },
  copyBtn: {
    width: '100%', background: '#059669', color: '#fff',
    border: 'none', borderRadius: 12, padding: '14px 20px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
};
