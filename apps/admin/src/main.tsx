import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AdminModeProvider } from './contexts/AdminModeContext';
import { LocaleProvider, initialLocale } from './contexts/LocaleContext';
import { DisplayPreferencesProvider } from './contexts/DisplayPreferencesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { loadCatalog } from './i18n/messages';
import './index.css';

const routerBaseName = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
// A stalled catalog request must not block the first paint; LocaleProvider switches once it arrives.
const FIRST_PAINT_CATALOG_TIMEOUT_MS = 3000;

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename={routerBaseName}>
        <ThemeProvider>
          <LocaleProvider>
            <AppErrorBoundary>
              <ToastProvider>
                <AdminModeProvider>
                  <AuthProvider>
                    <DisplayPreferencesProvider>
                      <App />
                    </DisplayPreferencesProvider>
                  </AuthProvider>
                </AdminModeProvider>
              </ToastProvider>
            </AppErrorBoundary>
          </LocaleProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

Promise.race([
  loadCatalog(initialLocale()),
  new Promise((resolve) => window.setTimeout(resolve, FIRST_PAINT_CATALOG_TIMEOUT_MS)),
])
  .catch(() => undefined)
  .then(renderApp);
