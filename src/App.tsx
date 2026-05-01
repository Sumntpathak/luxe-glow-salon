import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';

// Public pages
import LandingPage from '@/pages/LandingPage';
import PublicBookPage from '@/pages/PublicBookPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
import ForBusinessPage from '@/pages/ForBusinessPage';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VendorSignupPage from '@/pages/auth/VendorSignupPage';

// Consumer pages
import BookPage from '@/pages/consumer/BookPage';
import AppointmentsPage from '@/pages/consumer/AppointmentsPage';
import ProfilePage from '@/pages/consumer/ProfilePage';
import RewardsPage from '@/pages/consumer/RewardsPage';

// Staff pages
import CalendarPage from '@/pages/staff/CalendarPage';
import StaffClientsPage from '@/pages/staff/ClientsPage';
import EarningsPage from '@/pages/staff/EarningsPage';
import SchedulePage from '@/pages/staff/SchedulePage';

// Admin pages
import DashboardPage from '@/pages/admin/DashboardPage';
import BookingsPage from '@/pages/admin/BookingsPage';
import AdminClientsPage from '@/pages/admin/ClientsPage';
import StaffPage from '@/pages/admin/StaffPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import InventoryPage from '@/pages/admin/InventoryPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import MarketingPage from '@/pages/admin/MarketingPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import BillingPage from '@/pages/admin/BillingPage';
import LocationsPage from '@/pages/admin/LocationsPage';

// Layouts
import { PortalLayout } from '@/components/shared/portal-layout';

function ProtectedRoute({ role, children, allowExpiredTrial = false }: {
  role: 'admin' | 'staff' | 'consumer';
  children: React.ReactNode;
  allowExpiredTrial?: boolean;
}) {
  const { currentUser, organizations, currentOrgId } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to="/" replace />;

  // Trial paywall: admins with expired trial are forced to billing page
  if (role === 'admin' && !allowExpiredTrial) {
    const org = organizations.find(o => o.id === currentOrgId);
    const trialExpired =
      org?.subscriptionStatus === 'trialing' &&
      new Date(org.trialEndsAt).getTime() < Date.now();
    if (trialExpired) return <Navigate to="/admin/billing" replace />;
  }

  return <PortalLayout role={role}>{children}</PortalLayout>;
}

export default function App() {
  const { darkMode } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm !rounded-xl !shadow-lg',
          style: {
            background: darkMode ? '#1c1b19' : '#ffffff',
            color: darkMode ? '#eae5df' : '#1a1a1a',
            border: `1px solid ${darkMode ? '#332f2b' : '#e8e2da'}`,
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<PublicBookPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Vendor / SaaS marketing & onboarding */}
        <Route path="/for-business" element={<ForBusinessPage />} />
        <Route path="/vendor-signup" element={<VendorSignupPage />} />

        {/* Consumer portal (logged in) */}
        <Route path="/consumer/book" element={<ProtectedRoute role="consumer"><BookPage /></ProtectedRoute>} />
        <Route path="/consumer/appointments" element={<ProtectedRoute role="consumer"><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/consumer/profile" element={<ProtectedRoute role="consumer"><ProfilePage /></ProtectedRoute>} />
        <Route path="/consumer/rewards" element={<ProtectedRoute role="consumer"><RewardsPage /></ProtectedRoute>} />

        {/* Staff portal */}
        <Route path="/staff/calendar" element={<ProtectedRoute role="staff"><CalendarPage /></ProtectedRoute>} />
        <Route path="/staff/clients" element={<ProtectedRoute role="staff"><StaffClientsPage /></ProtectedRoute>} />
        <Route path="/staff/earnings" element={<ProtectedRoute role="staff"><EarningsPage /></ProtectedRoute>} />
        <Route path="/staff/schedule" element={<ProtectedRoute role="staff"><SchedulePage /></ProtectedRoute>} />

        {/* Admin portal */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute role="admin"><BookingsPage /></ProtectedRoute>} />
        <Route path="/admin/clients" element={<ProtectedRoute role="admin"><AdminClientsPage /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute role="admin"><StaffPage /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute role="admin"><ServicesPage /></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute role="admin"><InventoryPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/marketing" element={<ProtectedRoute role="admin"><MarketingPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute role="admin" allowExpiredTrial><BillingPage /></ProtectedRoute>} />
        <Route path="/admin/locations" element={<ProtectedRoute role="admin"><LocationsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
