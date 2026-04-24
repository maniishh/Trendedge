import { useState, useEffect } from 'react';
import { Search, X, TrendingUp, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { stockAPI } from '../api';
import { useToast } from '../components/Toast';

export default function Markets() {
  const toast = useToast();
  const [query,         setQuery]         = useState('');
  const [suggestions,   setSuggestions]   = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [topStocks,     setTopStocks]     = useState([]);
  const [topLoading,    setTopLoading]    = useState(true);
  const [isDemo,        setIsDemo]        = useState(false);

  useEffect(() => {
    stockAPI.dashboard()
      .then(({ data }) => {
        const list = data.data?.slice(0, 8) || [];
        setTopStocks(list);
        setIsDemo(list.some(s => s.isDemo));
      })
      .catch(() => toast && toast.error('Failed to load market data'))
      .finally(() => setTopLoading(false));
  }, []); // eslint-disable-line

  // Debounced symbol search
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      stockAPI.search(query)
        .then(({ data }) => setSuggestions(data.data || []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadDetail = async (sym) => {
    setSelected(sym);
    setDetail(null);
    setDetailLoading(true);
    setSuggestions([]);
    setQuery('');
    try {
      const { data } = await stockAPI.detail(sym);
      setDetail(data.data);
    } catch {
      toast && toast.error(`No data for ${sym}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const chartData = detail ? {
    labels: detail.history.map(h => h.date.slice(5)),
    datasets: [{
      label: 'Close',
      data:  detail.history.map(h => h.close),
      borderColor: detail.changePct >= 0 ? 'var(--green)' : 'var(--red)',
      backgroundColor: detail.changePct >= 0 ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
      fill: true,
      tension: .35,
      pointRadius: 0,
      borderWidth: 2,
    }],
  } : null;

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => ` $${c.parsed.y.toFixed(2)}` } },
    },
    scales: {
      x: { ticks: { color:'#94a3b8', maxTicksLimit:8 }, grid: { color:'#1e223540' } },
      y: { ticks: { color:'#94a3b8', callback: v => `$${v}` }, grid: { color:'#1e223540' } },
    },
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22, marginBottom:2 }}>Markets</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>Search and explore stocks</p>
      </div>

      {isDemo && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
          background:'#f59e0b18', border:'1px solid #f59e0b40',
          borderRadius:'var(--radius)', marginBottom:20, fontSize:13,
        }}>
          <AlertCircle size={15} color="var(--yellow)" />
          <span style={{ color:'var(--yellow)' }}>Demo data — add <code style={{ background:'#0005', padding:'1px 5px', borderRadius:4 }}>ALPHA_API_KEY</code> to .env for live prices.</span>
        </div>
      )}

      {/* Search box */}
      <div style={{ position:'relative', maxWidth:460, marginBottom:28 }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
        <input
          style={{ paddingLeft:36, paddingRight: query ? 36 : undefined }}
          placeholder="Search symbol or company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
            <X size={14} />
          </button>
        )}
        {suggestions.length > 0 && (
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
            background:'var(--bg-elevated)', border:'1px solid var(--bg-border)',
            borderRadius:'var(--radius-lg)', zIndex:50, overflow:'hidden',
            boxShadow:'var(--shadow)',
          }}>
            {suggestions.map(s => (
              <div key={s.symbol} onClick={() => loadDetail(s.symbol)}
                style={{ padding:'10px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--bg-border)', transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span className="mono" style={{ fontWeight:700, color:'var(--accent)' }}>{s.symbol}</span>
                <span style={{ color:'var(--text-muted)', fontSize:12, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card" style={{ marginBottom:28 }}>
          {detailLoading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : detail ? (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:20 }}>
                <div>
                  <div className="mono" style={{ fontWeight:800, fontSize:22, color:'var(--text-primary)', marginBottom:2 }}>{detail.symbol}</div>
                  <div className="mono" style={{ fontSize:32, fontWeight:800 }}>${detail.current.toFixed(2)}</div>
                  <div style={{ color: detail.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600, marginTop:4, fontSize:14 }}>
                    {detail.changePct >= 0 ? '▲' : '▼'} ${Math.abs(detail.change).toFixed(2)} ({detail.changePct >= 0 ? '+' : ''}{detail.changePct}%)
                  </div>
                </div>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                  {[
                    { label:'20-DMA',     val:`$${detail.dma20.toFixed(2)}` },
                    { label:'vs 20-DMA',  val:`${detail.dmaPct >= 0 ? '+' : ''}${detail.dmaPct}%` },
                    { label:'Signal',     val:detail.signal },
                  ].map(m => (
                    <div key={m.label}>
                      <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>{m.label}</p>
                      <p className="mono" style={{ fontWeight:700, fontSize:15 }}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height:220 }}>
                <Line data={chartData} options={chartOpts} />
              </div>
            </>
          ) : (
            <p style={{ color:'var(--text-muted)' }}>No data available for {selected}.</p>
          )}
        </div>
      )}

      {/* Overview table */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <TrendingUp size={16} color="var(--accent)" />
          <h3 style={{ fontSize:14, fontWeight:600 }}>Market Overview</h3>
        </div>
        {topLoading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : topStocks.length === 0 ? (
          <p style={{ color:'var(--text-muted)', padding:'20px 0', textAlign:'center' }}>No data available.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr><th>Symbol</th><th>Price</th><th>Change</th><th>vs 20-DMA</th><th>Signal</th></tr>
              </thead>
              <tbody>
                {topStocks.map(s => (
                  <tr key={s.symbol} style={{ cursor:'pointer' }} onClick={() => loadDetail(s.symbol)}>
                    <td><span className="mono" style={{ fontWeight:700, color:'var(--accent)' }}>{s.symbol}</span></td>
                    <td><span className="mono">${s.current?.toFixed(2)}</span></td>
                    <td>
                      <span style={{ color: s.changePct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                        {s.changePct >= 0 ? '▲' : '▼'} {Math.abs(s.changePct)}%
                      </span>
                    </td>
                    <td style={{ color: s.dmaPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {s.dmaPct >= 0 ? '+' : ''}{s.dmaPct}%
                    </td>
                    <td>
                      <span className={`badge badge-${s.signal === 'Buy' ? 'green' : s.signal === 'Sell' ? 'red' : 'blue'}`}>
                        {s.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
