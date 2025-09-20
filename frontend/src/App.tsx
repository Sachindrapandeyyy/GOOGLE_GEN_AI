import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';

// Lazy load pages for better performance
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Diary = lazy(() => import('./pages/Diary'));
const Chat = lazy(() => import('./pages/Chat'));
const Mood = lazy(() => import('./pages/Mood'));
const Insights = lazy(() => import('./pages/Insights'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();
  
  if (!user.isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const { user, setOfflineStatus } = useStore();
  
  // Initialize app
  useEffect(() => {
    // Check if user is already authenticated
    const userId = localStorage.getItem('sukoon-user-id');
    if (userId) {
      // If user ID exists, set it in the store
      const isOnboarded = localStorage.getItem('sukoon-onboarded') === 'true';
      useStore.setState({
        user: {
          userId,
          isAuthenticated: true,
          isOnboarded,
        }
      });
    }
    
    // Set up offline status listener
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial offline status
    setOfflineStatus(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/" element={
            <ProtectedRoute>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Dashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/diary" element={
            <ProtectedRoute>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Diary />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Chat />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/mood" element={
            <ProtectedRoute>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Mood />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="/insights" element={
            <ProtectedRoute>
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Insights />
              </ErrorBoundary>
            </ProtectedRoute>
          } />

          {/* Redirect to onboarding if not authenticated, otherwise to dashboard */}
          <Route path="*" element={
            user.isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/onboarding" replace />
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;