import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { PageLoading } from './components/ui/PageLoading';

const Overview = lazy(() =>
  import('./pages/Overview').then((module) => ({ default: module.Overview }))
);
const Links = lazy(() => import('./pages/Links').then((module) => ({ default: module.Links })));
const CreateLink = lazy(() =>
  import('./pages/CreateLink').then((module) => ({ default: module.CreateLink }))
);
const BulkCreateLinks = lazy(() =>
  import('./pages/BulkCreateLinks').then((module) => ({ default: module.BulkCreateLinks }))
);
const EditLink = lazy(() =>
  import('./pages/EditLink').then((module) => ({ default: module.EditLink }))
);
const ImportExport = lazy(() =>
  import('./pages/ImportExport').then((module) => ({ default: module.ImportExport }))
);
const Tags = lazy(() => import('./pages/Tags').then((module) => ({ default: module.Tags })));
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings }))
);
const AuditLogs = lazy(() =>
  import('./pages/AuditLogs').then((module) => ({ default: module.AuditLogs }))
);
const Analytics = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics }))
);
const LinkAnalytics = lazy(() =>
  import('./pages/LinkAnalytics').then((module) => ({ default: module.LinkAnalytics }))
);
const Backups = lazy(() =>
  import('./pages/Backups').then((module) => ({ default: module.Backups }))
);
const ApiTokens = lazy(() =>
  import('./pages/ApiTokens').then((module) => ({ default: module.ApiTokens }))
);
const Domains = lazy(() =>
  import('./pages/Domains').then((module) => ({ default: module.Domains }))
);
const RedirectRules = lazy(() =>
  import('./pages/RedirectRules').then((module) => ({ default: module.RedirectRules }))
);
const Groups = lazy(() => import('./pages/Groups').then((module) => ({ default: module.Groups })));
const HealthChecks = lazy(() =>
  import('./pages/HealthChecks').then((module) => ({ default: module.HealthChecks }))
);
const Setup = lazy(() => import('./pages/Setup').then((module) => ({ default: module.Setup })));
const Operations = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.Operations }))
);

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  if (loading) {
    return <PageLoading fullScreen />;
  }
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="setup" element={<Setup />} />
        <Route path="links" element={<Links />} />
        <Route path="links/create" element={<CreateLink />} />
        <Route path="links/bulk-create" element={<BulkCreateLinks />} />
        <Route path="links/:id/edit" element={<EditLink />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/links/:id" element={<LinkAnalytics />} />
        <Route path="domains" element={<Domains />} />
        <Route path="redirect-rules" element={<RedirectRules />} />
        <Route path="groups" element={<Groups />} />
        <Route path="health-checks" element={<HealthChecks />} />
        <Route path="operations" element={<Operations />} />
        <Route path="tags" element={<Tags />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="backups" element={<Backups />} />
        <Route path="api-tokens" element={<ApiTokens />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
