export default function StockCard({ stock, onClick }) {
  const isUp = stock.changePct >= 0;
  const signalClass = { Buy:'badge-green', Sell:'badge-red', Neutral:'badge-blue' }[stock.signal] || 'badge-blue';

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor:     onClick ? 'pointer' : 'default',
        borderLeft: `3px solid ${isUp ? 'var(--green)' : 'var(--red)'}`,
        transition: 'transform .15s, border-color .15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span className="mono" style={{ fontWeight:800, fontSize:16 }}>{stock.symbol}</span>
        <span className={`badge ${signalClass}`}>{stock.signal}</span>
      </div>

      <div className="mono" style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>
        ${stock.current?.toFixed(2)}
      </div>

      <div style={{ display:'flex', gap:14, fontSize:12, flexWrap:'wrap' }}>
        <span style={{ color: isUp ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
          {isUp ? '▲' : '▼'} {Math.abs(stock.changePct)}%
        </span>
        <span style={{ color:'var(--text-muted)' }}>
          DMA <span className="mono" style={{ color:'var(--text-secondary)' }}>${stock.dma20?.toFixed(2)}</span>
        </span>
      </div>

      {stock.isDemo && (
        <div style={{ marginTop:8, fontSize:10, color:'var(--text-muted)', fontStyle:'italic' }}>demo data</div>
      )}
    </div>
  );
}
