import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'
import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider defaultTheme="system" storageKey="clonefy-theme">
      <App />
    </ThemeProvider>
  </HelmetProvider>
);
