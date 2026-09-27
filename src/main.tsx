import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeScreen } from './ui/screens/HomeScreen/HomeScreen.tsx';
import { ProjectDetail } from './ui/projects/ProjectDetail.tsx';
import './app.css';

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  const match = path.match(/^\/projects\/([^/]+)\/?$/);
  return match ? <ProjectDetail slug={decodeURIComponent(match[1])} /> : <HomeScreen />;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
