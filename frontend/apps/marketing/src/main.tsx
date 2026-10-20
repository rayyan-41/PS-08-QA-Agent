import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@pokayoke/brand/theme.css';
import '@pokayoke/ui/styles.css';
import './styles.css';
import { App } from './App';
import { loadConfig } from './config';

async function start() {
  const config = await loadConfig();
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root is missing.');
  createRoot(root).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <App config={config} />
      </MotionConfig>
    </StrictMode>,
  );
}

void start();
