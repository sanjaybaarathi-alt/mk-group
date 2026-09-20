import { useEffect, useRef, useState } from 'react';
import { stagePhotos } from '../../screens/HomeScreen/imageAssets.ts';
import './ArchitecturalJourney.css';

const phases = [
  { name: 'Structure', detail: 'Concrete raft, columns, and structural slabs establish the load path.' },
  { name: 'Interior', detail: 'A furnished lounge, dining area, fluted timber wall, and stone kitchen take shape.' },
  { name: 'Glazing', detail: 'Sliding glass, slim dark frames, and flush tracks open the rooms to the site.' },
  { name: 'Complete', detail: 'A skylit roof, planted edge, terrace, water feature, and warm lighting finish the home.' },
] as const;

export function ArchitecturalJourney({ stage, onStageChange }: { stage: number; onStageChange: (stage: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const ecosystemStage = useRef(stage);
  const [enabled, setEnabled] = useState(false);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [view, setView] = useState<'exterior' | 'interior'>('exterior');
  const orbit = useRef({ yaw: -.3, pitch: -.09 });
  ecosystemStage.current = stage;

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const container = host.current;
    if (!enabled || !container) return;
    if (!('IntersectionObserver' in window)) { setNear(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    const container = host.current;
    if (!enabled || !near || !container) return;
    let disposed = false;
    let stop: (() => void) | undefined;

    void Promise.all([import('three'), import('three/addons/environments/RoomEnvironment.js'), import('./createHouseStudy.ts')]).then(([THREE, { RoomEnvironment }, { createHouseStudy }]) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      } catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      setActive(true);

      const scene = new THREE.Scene();
      const environment = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environmentMap = pmrem.fromScene(environment).texture;
      scene.environment = environmentMap;
      scene.environmentIntensity = .75;
      environment.dispose();
      pmrem.dispose();
      const camera = new THREE.PerspectiveCamera(34, 1, .1, 45);
      camera.position.set(9.8, 6.1, 11.5);
      camera.lookAt(0, .8, .15);
      scene.add(new THREE.HemisphereLight(0xe7f0ef, 0x82745f, 1.25));
      const sunlight = new THREE.DirectionalLight(0xffe5be, 3.1);
      sunlight.position.set(-6, 11, 8);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.set(1024, 1024);
      sunlight.shadow.camera.left = -9;
      sunlight.shadow.camera.right = 9;
      sunlight.shadow.camera.top = 9;
      sunlight.shadow.camera.bottom = -9;
      sunlight.shadow.bias = -.0002;
      scene.add(sunlight);
      const fill = new THREE.DirectionalLight(0xaed0df, 1.1);
      fill.position.set(5, 4, -6);
      scene.add(fill);
      const { world, house, parts, dispose } = createHouseStudy();
      scene.add(world);
      parts.forEach((part, index) => { if (index > 0) part.scale.y = .001; });

      const resize = () => {
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      let lastX = 0;
      let lastY = 0;
      let dragging = false;
      const onPointerDown = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; container.setPointerCapture(event.pointerId); };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        orbit.current.yaw += (event.clientX - lastX) * .008;
        orbit.current.pitch = Math.max(-.35, Math.min(.23, orbit.current.pitch + (event.clientY - lastY) * .003));
        lastX = event.clientX; lastY = event.clientY;
      };
      const onPointerUp = () => { dragging = false; };
      container.addEventListener('pointerdown', onPointerDown);
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerup', onPointerUp);
      container.addEventListener('pointercancel', onPointerUp);

      let frame = 0;
      let visible = true;
      const draw = () => {
        if (!visible || document.hidden) { frame = 0; return; }
        const active = ecosystemStage.current;
        parts.forEach((part, index) => {
          const target = index <= active ? 1 : .001;
          part.scale.y += (target - part.scale.y) * .075;
          part.visible = part.scale.y > .015;
        });
        house.rotation.y += (orbit.current.yaw - house.rotation.y) * .07;
        house.rotation.x += (orbit.current.pitch - house.rotation.x) * .07;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(draw);
      };
      draw();
      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && frame === 0) draw();
        else if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      });
      visibility.observe(container);
      const onVisibility = () => {
        if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
        else if (visible && frame === 0) draw();
      };
      document.addEventListener('visibilitychange', onVisibility);
      stop = () => {
        cancelAnimationFrame(frame);
        document.removeEventListener('visibilitychange', onVisibility);
        visibility.disconnect();
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerup', onPointerUp);
        container.removeEventListener('pointercancel', onPointerUp);
        observer.disconnect();
        dispose();
        environmentMap.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        setActive(false);
      };
      if (disposed) stop();
    });
    return () => { disposed = true; stop?.(); };
  }, [enabled, near]);

  const selectView = (next: 'exterior' | 'interior') => {
    setView(next);
    orbit.current = next === 'interior' ? { yaw: .1, pitch: -.31 } : { yaw: -.3, pitch: -.09 };
  };

  return <section className={`mk-journey${active ? ' is-active' : ''}`} aria-labelledby="mk-journey-title">
    <div className="mk-journey__heading"><div><span className="mk-journey__eyebrow">INTERACTIVE DESIGN CONCEPT / 01—04</span><h3 id="mk-journey-title">A home, from the inside out.</h3></div><p>Select a phase, then inspect the material layers and furnished rooms from two views.</p></div>
    <div className="mk-journey__workspace">
      <div className="mk-journey__visual">
        <div ref={host} className="mk-journey__canvas" aria-hidden="true" />
        <img className="mk-journey__fallback" src={stagePhotos[stage].src} alt={stagePhotos[stage].alt} />
        {active && <div className="mk-journey__views" role="group" aria-label="Model viewpoint"><button type="button" aria-pressed={view === 'exterior'} onClick={() => selectView('exterior')}>Exterior</button><button type="button" aria-pressed={view === 'interior'} onClick={() => selectView('interior')}>Interior</button></div>}
        <div className="mk-journey__caption"><span>MK / FURNISHED CONCEPT MODEL</span><span>{active ? 'DRAG TO ROTATE' : `PHASE 0${stage + 1}`}</span></div>
      </div>
      <div className="mk-journey__controls" role="group" aria-label="Build phases">
        {phases.map((phase, index) => <button type="button" key={phase.name} aria-pressed={stage === index} onClick={() => onStageChange(index)}>
          <span className="mk-journey__number">0{index + 1}</span><span className="mk-journey__text"><strong>{phase.name}</strong><small>{phase.detail}</small></span><span className="mk-journey__arrow" aria-hidden="true">↗</span>
        </button>)}
      </div>
    </div>
  </section>;
}
