import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import '@pokayoke/ui/styles.css';
import './styles.css';
import { App } from './App';
import { loadConfig } from './config';

const queryClient = new QueryClient();
async function start() {
  const config = await loadConfig();
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App config={config} />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void start();
