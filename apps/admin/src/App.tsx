import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { checkMe } from './api/auth';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import LinksPage from './pages/LinksPage';
import CreateLinkPage from './pages/CreateLinkPage';
import ImportExportPage from './pages/ImportExportPage';
import TagsPage from './pages/TagsPage';
import SettingsPage from './pages/SettingsPage';

interface AuthContextType {
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  setAuthenticated: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('linkora_token');
    if (!token) {
      setLoading(false);
      return;
    }
    checkMe().then((ok) => {
      setAuthenticated(ok);
      if (!ok) localStorage.removeItem('linkora_token');
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="links/create" element={<CreateLinkPage />} />
            <Route path="import-export" element={<ImportExportPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
