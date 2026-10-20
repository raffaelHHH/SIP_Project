import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { countAppOpen } from './lib/store';
import { startSync } from './lib/sync';
import './styles/global.css';

countAppOpen();
startSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
