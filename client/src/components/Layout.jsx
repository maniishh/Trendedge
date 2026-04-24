import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, Briefcase,
  Bell, Settings, LogOut, Menu, X, ChevronRight,
  Zap
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={17}/>,  label: 'Dashboard' },
  { to: '/markets',   icon: <TrendingUp size={17}/>,        label: 'Markets'   },
  { to: '/portfolio', icon: <Briefcase size={17}/>,         label: 'Portfolio' },
  { to: '/alerts',    icon: <Bell size={17}/>,              label: 'Alerts'    },
  { to: '/settings',  icon: <Settings size={17}/>,          label: 'Settings'  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? (user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()
    : '?';

  const Sidebar = ({ mobile = false }) => (
    <aside style={{
      width: mobile ? '100%' : 220,
      background: 'var(--bg-card)',
      borderRight: mobile ? 'none' : '1px solid var(--bg-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '1rem 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0.5rem 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: 'var(--accent)', borderRadius: 8,
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={16} color="#fff" fill="#fff"/>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>TrendEdge</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 0.75rem' }}>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            {n.icon} {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--bg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={14}/> Log out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <div style={{ height: '100%' }} className="sidebar-wrap">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
        }} onClick={() => setOpen(false)}>
          <div style={{ width: 260, background: 'var(--bg-card)', height: '100%' }} onClick={e => e.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <header style={{
          display: 'none',
          padding: '0.75rem 1rem',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--bg-border)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="mobile-header">
          <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
            <Menu size={18}/>
          </button>
          <span style={{ fontWeight: 800 }}>TrendEdge</span>
          <div style={{ width: 36 }}/>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-wrap { display: none !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
