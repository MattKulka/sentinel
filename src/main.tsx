import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function enableMocking() {
  // MSW *is* the backend for this app — there is no server. Run it in every
  // build (dev, E2E preview, and the deployed Vercel demo) so the app is always
  // fully functional. `bypass` lets real asset requests through untouched.
  const { worker } = await import('./mocks/browser.ts');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
