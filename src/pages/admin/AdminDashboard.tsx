import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAllMasterChecklists } from '../../hooks/useChecklistsFirestore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userDoc } = useAuth();
  const { checklists, loading } = useAllMasterChecklists();

  if (!userDoc || userDoc.role !== 'admin') {
    return (
      <div className="page-container text-center py-20">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-stone-400 mt-2">Admin access only.</p>
      </div>
    );
  }

  const publishedCount = checklists.filter((c) => c.isPublic).length;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🛡️</span>
        <h1 className="page-title mb-0">Admin Dashboard</h1>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-amber-300 text-sm">
        <strong>Admin Mode.</strong> Actions here affect real checklist data visible to collectors.
        Billing and privileged user mutations still require Cloud Functions when implemented.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate('/admin/checklists')}
          className="bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-2xl p-5 text-left transition-all"
        >
          <div className="text-3xl mb-3">✅</div>
          <div className="font-bold text-stone-50">Manage Checklists</div>
          <div className="text-stone-400 text-sm mt-1">
            Create, import CSV rows, publish master checklists
          </div>
        </button>
      </div>

      <section className="mb-8">
        <h2 className="section-title">Users</h2>
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 text-center text-stone-500">
          <p className="text-stone-300 font-semibold mb-1">Not connected</p>
          <p className="text-sm">
            Listing all users requires a secure backend query or Firebase Admin — no placeholder table here.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Master Checklists</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/checklists')}
            className="text-amber-400 hover:underline text-sm"
          >
            Manage →
          </button>
        </div>
        {loading ? (
          <p className="text-stone-500 text-sm">Loading...</p>
        ) : (
          <>
            <p className="text-stone-500 text-sm mb-4">
              {publishedCount} published · {checklists.length} total
            </p>
            <div className="space-y-2">
              {checklists.slice(0, 15).map((cl) => (
                <div
                  key={cl.id}
                  className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-semibold text-stone-200">{cl.name}</span>
                    <span className="text-stone-500 text-sm ml-2">{cl.totalCars} cars</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      cl.isPublic ? 'bg-green-700 text-green-200' : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {cl.isPublic ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
