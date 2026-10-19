import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { countAppOpen } from './lib/store';
import './styles/global.css';

countAppOpen();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
