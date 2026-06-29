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
import { InitiativeValuePage } from './pages/InitiativeValuePage';
import { TimelinePage } from './pages/TimelinePage';
import { ComparativePage } from './pages/ComparativePage';
import { RisksPage } from './pages/RisksPage';
import { DependencyMapPage } from './pages/DependencyMapPage';

// Proteced Route Wrapper
const ProtectedRoute = ({ children, allowedRoles, requiredPage }: { children: React.ReactElement, allowedRoles?: string[], requiredPage?: string }) => {
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

  if (requiredPage && user) {
    // Admin bypasses specific page check for main pages
    if (user.role === 'admin') return children;

    // If user has no allowed_pages set, give them access to the main pages by default including support
    const allowed = user.allowed_pages || ['/', '/dashboard', '/one-pager', '/initiative-value', '/support', '/timeline', '/comparative', '/risks', '/dependencies'];
    if (!allowed.includes(requiredPage)) {
      // Send them to the first page they ARE allowed to see, or fallback
      const fallback = allowed.length > 0 ? allowed[0] : '/';
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={
          <ProtectedRoute requiredPage="/">
            <RoadmapPage />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute requiredPage="/dashboard">
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="one-pager" element={
          <ProtectedRoute requiredPage="/one-pager">
            <OnePagerPage />
          </ProtectedRoute>
        } />
        <Route path="support" element={
          <ProtectedRoute requiredPage="/support">
            <SupportPage />
          </ProtectedRoute>
        } />
        <Route path="initiative-value" element={
          <ProtectedRoute requiredPage="/initiative-value">
            <InitiativeValuePage />
          </ProtectedRoute>
        } />
        <Route path="credentials" element={<CredentialsPage />} />
        <Route path="timeline" element={
          <ProtectedRoute requiredPage="/timeline">
            <TimelinePage />
          </ProtectedRoute>
        } />
        <Route path="comparative" element={
          <ProtectedRoute requiredPage="/comparative">
            <ComparativePage />
          </ProtectedRoute>
        } />
        <Route path="risks" element={
          <ProtectedRoute requiredPage="/risks">
            <RisksPage />
          </ProtectedRoute>
        } />
        <Route path="dependencies" element={
          <ProtectedRoute requiredPage="/dependencies">
            <DependencyMapPage />
          </ProtectedRoute>
        } />
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
