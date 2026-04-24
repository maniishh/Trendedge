import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Markets   from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Alerts    from './pages/Alerts';
import Settings  from './pages/Settings';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets"   element={<Markets />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/alerts"    element={<Alerts />} />
        <Route path="/settings"  element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
