import { useState } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--bg-border)' }}>
        <Icon size={15} color="var(--accent)" />
        <h3 style={{ fontSize:14, fontWeight:600 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [pwd,     setPwd]     = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [savingP, setSavingP] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingP(true);
    try {
      await authAPI.updateProfile(profile);
      await refreshUser();
      toast && toast.success('Profile updated');
    } catch (err) {
      toast && toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingP(false); }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) { toast && toast.error('Passwords do not match'); return; }
    if (pwd.newPassword.length < 8) { toast && toast.error('Min 8 characters'); return; }
    setSavingPwd(true);
    try {
      await authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast && toast.success('Password changed — please log in again');
      setPwd({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      toast && toast.error(err.response?.data?.message || 'Change failed');
    } finally { setSavingPwd(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:540 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontWeight:800, fontSize:22 }}>Settings</h1>
        <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>Manage your account</p>
      </div>

      {/* Account info */}
      <Section title="Account" icon={User}>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:18, padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius)' }}>
          <div style={{
            width:44, height:44, borderRadius:'50%', background:'var(--accent-dim)',
            border:'2px solid var(--accent)', display:'flex', alignItems:'center',
            justifyContent:'center', fontWeight:800, fontSize:16, color:'var(--accent)', flexShrink:0,
          }}>
            {(user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight:700, marginBottom:1 }}>@{user?.username}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>First Name</label>
              <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="John" />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Last Name</label>
              <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-ghost btn-sm" disabled={savingP}>
              <Save size={13} /> {savingP ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={changePwd} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { key:'currentPassword', label:'Current Password', ph:'••••••••' },
            { key:'newPassword',     label:'New Password',     ph:'Min 8 chars' },
            { key:'confirm',         label:'Confirm New',      ph:'Repeat password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>{f.label}</label>
              <input type="password" placeholder={f.ph} value={pwd[f.key]} onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <button type="submit" className="btn btn-ghost btn-sm" style={{ width:'fit-content' }} disabled={savingPwd}>
            <Lock size={13} /> {savingPwd ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </Section>
    </div>
  );
}
