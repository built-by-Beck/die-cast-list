import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_CHECKLISTS } from '../../data/mockData';

// Placeholder admin user list — Phase 7: fetch from Firestore
const MOCK_USERS = [
  { uid: 'mock-keith-001', email: 'keith@example.com', displayName: 'Keith', plan: 'premium', lifetimeAccess: true, lifetimeAccessReason: 'Founding Collector' },
  { uid: 'user-002', email: 'alice@example.com', displayName: 'Alice', plan: 'basic', lifetimeAccess: false, lifetimeAccessReason: null },
  { uid: 'user-003', email: 'bob@example.com', displayName: 'Bob', plan: 'none', lifetimeAccess: false, lifetimeAccessReason: null },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userDoc } = useAuth();

  // Double-check admin status in the component (AdminRoute already guards, but belt + suspenders)
  if (!userDoc || userDoc.role !== 'admin') {
    return (
      <div className="page-container text-center py-20">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-stone-400 mt-2">Admin access only.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🛡️</span>
        <h1 className="page-title mb-0">Admin Dashboard</h1>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-amber-300 text-sm">
        <strong>Admin Mode.</strong> Actions here affect real user data. Proceed carefully.
        All admin actions are logged.
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '✅', label: 'Manage Checklists', desc: 'Create, edit, publish master checklists', path: '/admin/checklists' },
          { icon: '👥', label: 'Users', desc: 'View users, grant lifetime access, set roles', path: '#users' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-2xl p-5 text-left transition-all"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <div className="font-bold text-stone-50">{action.label}</div>
            <div className="text-stone-400 text-sm mt-1">{action.desc}</div>
          </button>
        ))}
      </div>

      {/* Users table */}
      <section id="users" className="mb-8">
        <h2 className="section-title">Users</h2>
        <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-700 text-stone-500 uppercase text-xs tracking-wider">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Lifetime?</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.uid} className="border-b border-stone-700/50 last:border-0 hover:bg-stone-700/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-stone-200">{u.displayName}</td>
                    <td className="px-4 py-3 text-stone-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.plan === 'premium' ? 'bg-amber-500/20 text-amber-400' :
                        u.plan === 'basic'   ? 'bg-blue-500/20 text-blue-400' :
                        'bg-stone-700 text-stone-500'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.lifetimeAccess ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-700 text-green-200">
                          ✓ Lifetime
                        </span>
                      ) : (
                        <span className="text-stone-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!u.lifetimeAccess ? (
                        <button className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                          Grant Lifetime
                        </button>
                      ) : (
                        <button className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-stone-700 bg-amber-500/5">
            <p className="text-amber-500 text-xs font-semibold">
              ⚠️ Phase 7: Grant/Revoke lifetime access will call secure Cloud Functions — never written from frontend directly.
            </p>
          </div>
        </div>
      </section>

      {/* Checklists summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Master Checklists</h2>
          <button
            onClick={() => navigate('/admin/checklists')}
            className="text-amber-400 hover:underline text-sm"
          >
            Manage →
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_CHECKLISTS.map((cl) => (
            <div key={cl.id} className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-stone-200">{cl.name}</span>
                <span className="text-stone-500 text-sm ml-2">{cl.totalCars} cars</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                cl.isPublic ? 'bg-green-700 text-green-200' : 'bg-stone-700 text-stone-400'
              }`}>
                {cl.isPublic ? 'Published' : 'Draft'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
