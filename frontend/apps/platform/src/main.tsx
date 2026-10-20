import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import '@pokayoke/brand/theme.css';
import '@pokayoke/ui/styles.css';
import './styles.css';
import { App } from './App';
import { AuthProvider } from './auth';
import { devtoolsEnabled, loadConfig } from './config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

async function start() {
  const config = await loadConfig();
  const devtools = devtoolsEnabled(config, window.location.search);
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider config={config}>
            <App config={config} devtools={devtools} />
          </AuthProvider>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void start();
