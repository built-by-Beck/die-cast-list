import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, userDoc, loading, isMockMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔧</div>
          <div className="text-stone-400 text-xl">Loading your garage...</div>
        </div>
      </div>
    );
  }

  // Mock mode: always allow access
  if (isMockMode && userDoc) return <Outlet />;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
