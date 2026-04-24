import { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { portfolioAPI } from '../api';
import { useToast } from '../components/Toast';

function TradeModal({ onClose, onSuccess }) {
  const toast = useToast();
  const [form,   setForm]   = useState({ symbol:'', type:'BUY', quantity:'', price:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.symbol.trim() || !form.quantity || !form.price) {
      toast && toast.error('Symbol, quantity and price are required');
      return;
    }
    setSaving(true);
    try {
      await portfolioAPI.addTrade({
        ...form,
        symbol: form.symbol.trim().toUpperCase(),
        quantity: parseFloat(form.quantity),
        price:    parseFloat(form.price),
      });
      toast && toast.success(`${form.type} ${form.symbol.toUpperCase()} recorded`);
      onSuccess();
      onClose();
    } catch (err) {
      toast && toast.error(err.response?.data?.message || 'Trade failed');
    } finally { setSaving(false); }
  };

  const total = form.quantity && form.price
    ? (parseFloat(form.quantity || 0) * parseFloat(form.price || 0)).toFixed(2)
    : null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="card" style={{ width:'100%', maxWidth:420, padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontWeight:700 }}>Log Trade</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Symbol *</label>
              <input value={form.symbol} onChange={set('symbol')} placeholder="AAPL" style={{ textTransform:'uppercase', fontFamily:'monospace' }} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Type</label>
              <select value={form.type} onChange={set('type')}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Quantity *</label>
              <input type="number" min="0.0001" step="any" value={form.quantity} onChange={set('quantity')} placeholder="10" />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Price per share *</label>
              <input type="number" min="0.01" step="any" value={form.price} onChange={set('price')} placeholder="150.00" />
            </div>
          </div>
          {total && (
            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13, color:'var(--text-secondary)' }}>
              Total: <span className="mono" style={{ color:'var(--accent)', fontWeight:700 }}>${total}</span>
            </div>
          )}
          <div>
            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Notes (optional)</label>
            <input value={form.notes} onChange={set('notes')} placeholder="e.g. Earnings play" />
          </div>
          <button type="submit" className={`btn ${form.type === 'BUY' ? 'btn-primary' : 'btn-danger'}`} disabled={saving}>
            {saving ? 'Saving…' : `Log ${form.type}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const toast = useToast();
  const [data,    setData]    = useState(null);
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [tab,     setTab]     = useState('holdings');

  async function load() {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        portfolioAPI.get(),
        portfolioAPI.trades({ limit: 30 }),
      ]);
      setData(pRes.data.data);
      setTrades(tRes.data.data?.trades || []);
    } catch (err) {
      toast && toast.error('Failed to load portfolio');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const { summary, holdings } = data || {};
  const pnlColor = v => v >= 0 ? 'var(--green)' : 'var(--red)';
  const fmt      = v => v?.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) ?? '0.00';

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, marginBottom:2 }}>Portfolio</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Holdings & P&amp;L tracker</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
          <Plus size={14} /> Log Trade
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
            {[
              { label:'Invested',      val:`$${fmt(summary?.totalInvested)}`,  color:'var(--text-primary)' },
              { label:'Current Value', val:`$${fmt(summary?.totalCurrent)}`,   color:'var(--text-primary)' },
              { label:'Total P&L',     val:`${(summary?.totalPnl||0)>=0?'+':''}$${fmt(summary?.totalPnl)}`, color:pnlColor(summary?.totalPnl||0) },
              { label:'Return',        val:`${(summary?.totalPnlPct||0)>=0?'+':''}${(summary?.totalPnlPct||0).toFixed(2)}%`, color:pnlColor(summary?.totalPnlPct||0) },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding:'14px 16px' }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</p>
                <p className="mono" style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:16 }}>
            {['holdings','trades'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform:'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Holdings table */}
          {tab === 'holdings' && (
            <div className="card">
              {!holdings?.length ? (
                <div style={{ textAlign:'center', padding:'50px 20px' }}>
                  <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom:12 }} />
                  <p style={{ color:'var(--text-muted)' }}>No holdings yet — log your first trade to get started.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop:16 }} onClick={() => setModal(true)}>
                    <Plus size={13} /> Log Trade
                  </button>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Symbol</th><th>Qty</th><th>Avg Buy</th><th>Current</th><th>Invested</th><th>Value</th><th>P&L</th><th>Return</th></tr>
                    </thead>
                    <tbody>
                      {holdings.map(h => (
                        <tr key={h.symbol}>
                          <td><span className="mono" style={{ fontWeight:700, color:'var(--accent)' }}>{h.symbol}</span></td>
                          <td className="mono">{h.quantity}</td>
                          <td className="mono">${h.avgBuyPrice.toFixed(2)}</td>
                          <td className="mono">${h.currentPrice.toFixed(2)}</td>
                          <td>${fmt(h.invested)}</td>
                          <td>${fmt(h.currentValue)}</td>
                          <td style={{ color:pnlColor(h.pnl), fontWeight:600 }}>
                            {h.pnl >= 0 ? '+' : ''}${h.pnl.toFixed(2)}
                          </td>
                          <td style={{ color:pnlColor(h.pnlPct), fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                            {h.pnlPct >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {h.pnlPct.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Trades table */}
          {tab === 'trades' && (
            <div className="card">
              {!trades.length ? (
                <p style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)' }}>No trades recorded yet.</p>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {trades.map(t => (
                        <tr key={t._id}>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td><span className="mono" style={{ fontWeight:700, color:'var(--accent)' }}>{t.symbol}</span></td>
                          <td>
                            <span className={`badge ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.type}</span>
                          </td>
                          <td className="mono">{t.quantity}</td>
                          <td className="mono">${t.price.toFixed(2)}</td>
                          <td className="mono" style={{ fontWeight:600 }}>${t.total?.toFixed(2)}</td>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{t.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modal && <TradeModal onClose={() => setModal(false)} onSuccess={load} />}
    </div>
  );
}
