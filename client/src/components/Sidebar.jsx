import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Briefcase, Bell, Settings, LogOut, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard'  },
  { to: '/markets',   icon: <TrendingUp size={17} />,      label: 'Markets'    },
  { to: '/portfolio', icon: <Briefcase size={17} />,       label: 'Portfolio'  },
  { to: '/alerts',    icon: <Bell size={17} />,            label: 'Alerts'     },
  { to: '/settings',  icon: <Settings size={17} />,        label: 'Settings'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const toast            = useToast();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="var(--accent)" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
            Trend<span style={{ color: 'var(--accent)' }}>Edge</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '10px 12px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize:     13,
            fontWeight:   isActive ? 600 : 400,
            color:        isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background:   isActive ? 'var(--accent-dim)' : 'transparent',
            transition:   'all .15s',
          })}>
            {icon} {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}
