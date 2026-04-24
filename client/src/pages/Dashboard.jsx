import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Plus, X, TrendingUp, TrendingDown, BarChart2, AlertCircle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { stockAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StockCard from '../components/StockCard';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [stocks,  setStocks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [symbol,  setSymbol]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [isDemo,  setIsDemo]  = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await stockAPI.dashboard();
      const list = data.data || [];
      setStocks(list);
      setIsDemo(list.some(s => s.isDemo));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load stocks';
      setError(msg);
      toast && toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  const addToWatchlist = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    if ((user?.watchlist || []).includes(sym)) {
      toast && toast.info(`${sym} already in watchlist`);
      return;
    }
    const updated = [...(user?.watchlist || []), sym];
    setSaving(true);
    try {
      await authAPI.updateWatchlist({ symbols: updated });
      await refreshUser();
      setSymbol('');
      toast && toast.success(`${sym} added`);
      load();
    } catch (err) {
      toast && toast.error(err.response?.data?.message || 'Failed to add symbol');
    } finally { setSaving(false); }
  };

  const removeSymbol = async (sym) => {
    const updated = (user?.watchlist || []).filter(s => s !== sym);
    try {
      await authAPI.updateWatchlist({ symbols: updated.length ? updated : ['AAPL'] });
      await refreshUser();
      setStocks(prev => prev.filter(s => s.symbol !== sym));
      toast && toast.success(`${sym} removed`);
    } catch {
      toast && toast.error('Failed to remove');
    }
  };

  const gainers  = stocks.filter(s => s.changePct > 0).length;
  const losers   = stocks.filter(s => s.changePct < 0).length;
  const buyCount = stocks.filter(s => s.signal === 'Buy').length;

  const chartData = {
    labels: stocks.map(s => s.symbol),
    datasets: [
      {
        label: 'Current Price',
        data:  stocks.map(s => s.current),
        backgroundColor: stocks.map(s =>
          s.changePct >= 0 ? 'rgba(34,197,94,.75)' : 'rgba(239,68,68,.75)'
        ),
        borderRadius: 5,
      },
      {
        label: '20-DMA',
        data:  stocks.map(s => s.dma20),
        backgroundColor: 'rgba(99,102,241,.45)',
        borderRadius: 5,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
      tooltip: { callbacks: { label: c => ` $${c.parsed.y.toFixed(2)}` } },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e223540' } },
      y: {
        ticks: { color: '#94a3b8', callback: v => `$${v}` },
        grid: { color: '#1e223540' },
      },
    },
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:22, marginBottom:2 }}>Dashboard</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>
            {user?.watchlist?.length || 0} stocks tracked
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin .6s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
          background:'#f59e0b18', border:'1px solid #f59e0b40',
          borderRadius:'var(--radius)', marginBottom:20, fontSize:13,
        }}>
          <AlertCircle size={15} color="var(--yellow)" />
          <span style={{ color:'var(--yellow)' }}>
            Showing demo data — add your <code style={{ background:'#0005', padding:'1px 5px', borderRadius:4 }}>ALPHA_API_KEY</code> in <code style={{ background:'#0005', padding:'1px 5px', borderRadius:4 }}>.env</code> for live prices.
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
          background:'var(--red-dim)', border:'1px solid #ef444440',
          borderRadius:'var(--radius)', marginBottom:20, fontSize:13, color:'var(--red)',
        }}>
          <AlertCircle size={15} />
          {error} — <button onClick={load} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:13 }}>Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'Tracked',    value: stocks.length, color:'var(--accent)'  },
          { label:'Gainers',    value: gainers,        color:'var(--green)'   },
          { label:'Losers',     value: losers,         color:'var(--red)'     },
          { label:'Buy Signal', value: buyCount,       color:'var(--yellow)'  },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>
              {s.label}
            </p>
            <p className="mono" style={{ fontSize:26, fontWeight:800, color:s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Watchlist manager */}
      <div className="card" style={{ marginBottom:24 }}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Manage Watchlist</h3>
        <div style={{ display:'flex', gap:8 }}>
          <input
            placeholder="Add symbol, e.g. NVDA"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addToWatchlist()}
            style={{ flex:1, fontFamily:'monospace', textTransform:'uppercase' }}
          />
          <button className="btn btn-primary" onClick={addToWatchlist} disabled={saving || !symbol.trim()}>
            <Plus size={14} /> Add
          </button>
        </div>
        {/* Pills */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
          {user?.watchlist?.map(sym => (
            <div key={sym} style={{
              display:'flex', alignItems:'center', gap:6, padding:'3px 10px',
              background:'var(--bg-elevated)', border:'1px solid var(--bg-border)',
              borderRadius:99, fontSize:12, fontFamily:'monospace', fontWeight:600,
            }}>
              {sym}
              <button onClick={() => removeSymbol(sym)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:0, lineHeight:1 }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Loading / Stock grid */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : stocks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
          <p>No stocks to display. Add symbols to your watchlist above.</p>
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14, marginBottom:28 }}>
            {stocks.map(s => <StockCard key={s.symbol} stock={s} />)}
          </div>

          {/* Bar chart */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <BarChart2 size={16} color="var(--accent)" />
              <h3 style={{ fontSize:14, fontWeight:600 }}>Price vs 20-DMA</h3>
            </div>
            <div style={{ height:260 }}>
              <Bar data={chartData} options={chartOpts} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
