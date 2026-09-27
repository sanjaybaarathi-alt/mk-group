import '@fontsource-variable/manrope';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/jetbrains-mono';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeScreen } from './ui/screens/HomeScreen/HomeScreen.tsx';
import { ProjectDetail } from './ui/projects/ProjectDetail.tsx';
import { projects } from './ui/projects/projects.ts';
import './app.css';

const defaultTitle = 'MK Group of Companies — Construction, Interiors and Precision Windows';
const defaultDescription = 'MK Group of Companies coordinates construction, interior design and precision windows from foundation to finishing touches.';

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(property ? 'property' : 'name', name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const match = path.match(/^\/projects\/([^/]+)\/?$/);
  const project = match ? projects.find(item => item.slug === decodeURIComponent(match[1])) : undefined;

  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const title = project ? `${project.title} — MK Group Concept Portfolio` : defaultTitle;
    const description = project?.introduction ?? defaultDescription;
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', project ? 'article' : 'website', true);
    setMeta('og:image', new URL(project?.images[0].src ?? '/images/construction-sequence/06-complete.webp', window.location.origin).href, true);
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1, main h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  }, [path, project]);

  return match ? <ProjectDetail slug={decodeURIComponent(match[1])} /> : <HomeScreen />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
