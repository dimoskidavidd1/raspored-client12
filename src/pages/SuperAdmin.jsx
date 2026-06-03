import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function SuperAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [views, setViews] = useState({});
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'superadmin') { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    const [a, l, v] = await Promise.all([
      api.get('/superadmin/users'),
      api.get('/superadmin/logs'),
      api.get('/superadmin/views'),
    ]);
    setAdmins(Array.isArray(a.data) ? a.data : []);
    setLogs(Array.isArray(l.data) ? l.data : []);
    setViews(v.data || {});
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const createAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) return flash('❌ Fill in both fields');
    try {
      await api.post('/superadmin/users', newAdmin);
      setNewAdmin({ username: '', password: '' });
      loadAll();
      flash('✅ Admin created');
    } catch (err) { flash('❌ ' + (err.response?.data?.error || 'Error')); }
  };

  const deleteAdmin = async (id, username) => {
    if (!window.confirm(`Delete admin "${username}"?`)) return;
    await api.delete(`/superadmin/users/${id}`);
    loadAll();
    flash('✅ Admin deleted');
  };

  const resetPassword = async (id) => {
    if (!resetPw) return flash('❌ Enter a new password');
    await api.put(`/superadmin/users/${id}/password`, { password: resetPw });
    setResetId(null);
    setResetPw('');
    flash('✅ Password reset');
  };

  const actionColor = (action) => {
    if (action.includes('DELETE')) return 'text-red-500';
    if (action.includes('ADD') || action.includes('CREATE')) return 'text-green-500';
    if (action.includes('EDIT') || action.includes('RESET')) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">⚡ Super Admin Panel</h1>
      {msg && <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2 text-sm">{msg}</div>}

      <div className="flex gap-2 flex-wrap">
        {['users', 'logs', 'views'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
            {t === 'users' ? '👥 Admins' : t === 'logs' ? '📋 Audit Log' : '👁️ Viewer Stats'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">Create New Admin</h3>
            <div className="flex gap-3 flex-wrap">
              <input className="input" placeholder="Username" value={newAdmin.username}
                onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })} />
              <input className="input" placeholder="Password" type="password" value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
              <button className="btn-primary" onClick={createAdmin}>Create</button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {admins.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-medium">{a.username}</td>
                    <td className="px-4 py-2"><span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs">{a.role}</span></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 flex-wrap items-center">
                        {resetId === a.id ? (
                          <>
                            <input className="input w-36 text-xs py-1" placeholder="New password" type="password"
                              value={resetPw} onChange={e => setResetPw(e.target.value)} />
                            <button className="btn-primary text-xs px-2 py-1" onClick={() => resetPassword(a.id)}>Save</button>
                            <button className="btn-ghost text-xs px-2 py-1" onClick={() => setResetId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn-ghost text-xs px-2 py-1" onClick={() => { setResetId(a.id); setResetPw(''); }}>🔑 Reset PW</button>
                        )}
                        <button className="btn-danger text-xs px-2 py-1" onClick={() => deleteAdmin(a.id, a.username)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-gray-400">No admins found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Admin</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-gray-400 whitespace-nowrap font-mono text-xs">{l.created_at}</td>
                  <td className="px-4 py-2 font-medium">{l.admin_username}</td>
                  <td className={`px-4 py-2 font-mono text-xs font-bold ${actionColor(l.action)}`}>{l.action}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{l.details}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-gray-400">No activity yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'views' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Views', value: views.total, icon: '👁️' },
            { label: 'Views Today', value: views.today, icon: '📅' },
            { label: 'Views This Week', value: views.week, icon: '📊' },
          ].map(s => (
            <div key={s.label} className="card p-6 text-center space-y-2">
              <div className="text-4xl">{s.icon}</div>
              <div className="text-3xl font-bold">{s.value ?? '—'}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
