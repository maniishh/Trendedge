import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
