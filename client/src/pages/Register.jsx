import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Register() {
  const { register } = useAuth();
  const toast        = useToast();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ email: '', username: '', password: '', confirm: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.username || form.username.length < 3) e.username = 'Username min 3 chars';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))    e.username = 'Letters, numbers, underscore only';
    if (!form.password || form.password.length < 8) e.password = 'Password min 8 chars';
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(form.password))
      e.password = 'Needs uppercase, lowercase, and digit';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ email: form.email, username: form.username, password: form.password });
      toast.success('Account created! Welcome to TrendEdge.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, icon: Icon, right }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className={`input ${errors[name] ? 'input-error' : ''}`}
          style={{ paddingLeft: 36, paddingRight: right ? 40 : undefined }}
          type={name === 'password' || name === 'confirm' ? (showPwd ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[name]}
          onChange={set(name)}
          autoComplete={name === 'password' ? 'new-password' : name}
        />
        {right}
      </div>
      {errors[name] && <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{errors[name]}</p>}
    </div>
  );

  const togglePwd = (
    <button type="button" onClick={() => setShowPwd(v => !v)}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--accent-dim)',
            border: '1px solid rgba(0,212,255,.25)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <Activity size={26} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>
            Trend<span style={{ color: 'var(--accent)' }}>Edge</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Create your trading account</p>
        </div>

        <div className="card" style={{ padding: 30 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 22 }}>Create account</h2>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Email"    name="email"    type="email"  placeholder="trader@example.com" icon={Mail} />
            <Field label="Username" name="username" placeholder="e.g. johntrader"                 icon={User} />
            <Field label="Password" name="password" placeholder="Min 8 chars, uppercase + digit"  icon={Lock} right={togglePwd} />
            <Field label="Confirm password" name="confirm" placeholder="Repeat password"          icon={Lock} right={togglePwd} />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
