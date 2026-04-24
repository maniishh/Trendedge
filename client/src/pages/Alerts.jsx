import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Bell, X } from 'lucide-react';
import { alertAPI } from '../api';
import { useToast } from '../components/Toast';

function AlertModal({ onClose, onCreate }) {
  const toast = useToast();
  const [form,   setForm]   = useState({ symbol:'', condition:'above', targetPrice:'', note:'' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.symbol.trim() || !form.targetPrice) {
      toast && toast.error('Symbol and target price are required');
      return;
    }
    setSaving(true);
    try {
      await alertAPI.create({ ...form, symbol: form.symbol.trim().toUpperCase() });
      toast && toast.success('Alert created');
      onCreate();
      onClose();
    } catch (err) {
      toast && toast.error(err.response?.data?.message || 'Failed to create alert');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="card" style={{ width:'100%', maxWidth:380, padding:26 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ fontWeight:700 }}>New Price Alert</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Symbol *</label>
            <input value={form.symbol} onChange={set('symbol')} placeholder="AAPL" style={{ textTransform:'uppercase', fontFamily:'monospace' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Condition</label>
              <select value={form.condition} onChange={set('condition')}>
                <option value="above">Goes above</option>
                <option value="below">Falls below</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Target Price *</label>
              <input type="number" min="0.01" step="any" value={form.targetPrice} onChange={set('targetPrice')} placeholder="200.00" />
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Note (optional)</label>
            <input value={form.note} onChange={set('note')} placeholder="e.g. Breakout target" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Alert'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Alerts() {
  const toast   = useToast();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await alertAPI.list();
      setAlerts(data.data || []);
    } catch {
      toast && toast.error('Failed to load alerts');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const toggle = async (id) => {
    try {
      const { data } = await alertAPI.toggle(id);
      setAlerts(prev => prev.map(a => a._id === id ? data.data : a));
    } catch { toast && toast.error('Failed to toggle'); }
  };

  const remove = async (id) => {
    try {
      await alertAPI.delete(id);
      setAlerts(prev => prev.filter(a => a._id !== id));
      toast && toast.success('Alert deleted');
    } catch { toast && toast.error('Failed to delete'); }
  };

  const active = alerts.filter(a => a.isActive).length;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, marginBottom:2 }}>Price Alerts</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{active}/10 active alerts</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)} disabled={active >= 10}>
          <Plus size={14} /> New Alert
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <Bell size={40} color="var(--text-muted)" style={{ marginBottom:14 }} />
          <p style={{ color:'var(--text-muted)', marginBottom:16 }}>No alerts yet — create one to track a price target.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            <Plus size={13} /> Create Alert
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {alerts.map(a => (
            <div key={a._id} className="card" style={{
              display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
              opacity: a.isActive ? 1 : .5,
              borderLeft:`3px solid ${a.isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
              padding:'14px 18px',
            }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span className="mono" style={{ fontWeight:700, fontSize:15, color:'var(--accent)' }}>{a.symbol}</span>
                  {!a.isActive && (
                    <span className="badge badge-blue" style={{ fontSize:10 }}>Inactive</span>
                  )}
                </div>
                <p style={{ fontSize:12, color:'var(--text-secondary)' }}>
                  Trigger when price goes{' '}
                  <span style={{ color: a.condition === 'above' ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                    {a.condition}
                  </span>{' '}
                  <span className="mono" style={{ fontWeight:700, color:'var(--text-primary)' }}>
                    ${parseFloat(a.targetPrice).toFixed(2)}
                  </span>
                </p>
                {a.note && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{a.note}</p>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggle(a._id)} title={a.isActive ? 'Disable' : 'Enable'}>
                  {a.isActive
                    ? <ToggleRight size={15} color="var(--accent)" />
                    : <ToggleLeft  size={15} />
                  }
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(a._id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <AlertModal onClose={() => setModal(false)} onCreate={load} />}
    </div>
  );
}
