import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import PublicProfilePage from './pages/PublicProfilePage';
import PublicShowcasePage from './pages/PublicShowcasePage';

// App pages
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import AddEditCarPage from './pages/AddEditCarPage';
import CarDetailPage from './pages/CarDetailPage';
import ChecklistsPage from './pages/ChecklistsPage';
import ChecklistDetailPage from './pages/ChecklistDetailPage';
import ShowcasePage from './pages/ShowcasePage';
import ProfilePage from './pages/ProfilePage';
import WantedListPage from './pages/WantedListPage';
import ForSaleTradePage from './pages/ForSaleTradePage';
import SettingsPage from './pages/SettingsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChecklistsPage from './pages/admin/AdminChecklistsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/p/:slug" element={<PublicProfilePage />} />
          <Route path="/showcase/:userId" element={<PublicShowcasePage />} />

          {/* ── Protected routes (require login) ─────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Inventory */}
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/add" element={<AddEditCarPage />} />
              <Route path="/inventory/:carId" element={<CarDetailPage />} />
              <Route path="/inventory/:carId/edit" element={<AddEditCarPage />} />

              {/* Checklists */}
              <Route path="/checklists" element={<ChecklistsPage />} />
              <Route path="/checklists/:checklistId" element={<ChecklistDetailPage />} />

              {/* Other sections */}
              <Route path="/showcase" element={<ShowcasePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/wanted" element={<WantedListPage />} />
              <Route path="/for-sale-trade" element={<ForSaleTradePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* ── Admin routes (require admin role) ──── */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/checklists" element={<AdminChecklistsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
