import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeScreen } from './ui/screens/HomeScreen/HomeScreen.tsx';
import { ProjectDetail } from './ui/projects/ProjectDetail.tsx';
import './app.css';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (hash.startsWith('#/projects/')) { window.scrollTo(0, 0); return; }
    if (hash === '#projects') requestAnimationFrame(() => document.getElementById('projects')?.scrollIntoView());
  }, [hash]);
  const slug = hash.startsWith('#/projects/') ? decodeURIComponent(hash.slice('#/projects/'.length)) : null;
  return slug ? <ProjectDetail slug={slug} /> : <HomeScreen />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
