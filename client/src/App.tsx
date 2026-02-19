import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { YearProvider } from './context/YearContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { RoadmapPage } from './pages/RoadmapPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnePagerPage } from './pages/OnePagerPage';
import { ImportPage } from './pages/ImportPage';
import { SupportPage } from './pages/SupportPage';
import { CredentialsPage } from './pages/CredentialsPage';

// Proteced Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: string[] }) => {
  const { user, isLoading, token } = useAuth();

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#111827]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Cargando...</p>
      </div>
    </div>
  );
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // or 403 page
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoadmapPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="one-pager" element={<OnePagerPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="credentials" element={<CredentialsPage />} />
        <Route path="import" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ImportPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <YearProvider>
            <AppRoutes />
          </YearProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
