import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createConstructionHouse } from './constructionHouse';

export function createConstructionScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111915');
  scene.fog = new THREE.Fog('#111915', 34, 82);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 120);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(environment, .05);
  scene.environment = target.texture;
  scene.environmentIntensity = .82;
  environment.dispose();
  pmrem.dispose();
  const house = createConstructionHouse(() => requestDraw());
  house.root.position.x = 2.25;
  scene.add(house.root);
  const grid = new THREE.GridHelper(100, 64, 0x8f7657, 0x334139);
  grid.position.y = -.035;
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = .2;
  scene.add(grid);
  const sun = new THREE.DirectionalLight('#fff0da', 4.5);
  sun.position.set(-7, 14, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 45;
  sun.shadow.normalBias = .035;
  sun.shadow.bias = -.0002;
  sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight('#b8d1cf', 1.05);
  fill.position.set(10, 8, 5);
  const rim = new THREE.DirectionalLight('#d7a46f', 1.35);
  rim.position.set(2, 9, -11);
  scene.add(sun, fill, rim, new THREE.HemisphereLight('#dbe9ff', '#364139', .42));
  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let viewDistance = 1;
  let visible = true;
  let raf = 0;
  let disposed = false;
  const draw = () => {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    house.setProgress(progress);
    const cameraBeat = progress * progress * (3 - 2 * progress);
    house.root.rotation.y = THREE.MathUtils.lerp(-.045, .035, cameraBeat);
    camera.position.set(
      THREE.MathUtils.lerp(13.7, 12.25, cameraBeat) * viewDistance + pointerX,
      THREE.MathUtils.lerp(6.8, 5.85, cameraBeat) * viewDistance + pointerY,
      THREE.MathUtils.lerp(20.5, 18.6, cameraBeat) * viewDistance,
    );
    camera.lookAt(THREE.MathUtils.lerp(1.65, 2.15, cameraBeat), THREE.MathUtils.lerp(2.25, 2.85, cameraBeat), .3);
    renderer.render(scene, camera);
  };
  const requestDraw = () => { if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(draw); };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    camera.aspect = bounds.width / Math.max(1, bounds.height);
    const narrowPortrait = camera.aspect < .62;
    viewDistance = narrowPortrait ? 2.08 : camera.aspect < 1.1 ? 1.52 : camera.aspect < 1.55 ? 1.15 : 1;
    house.root.position.x = narrowPortrait ? .35 : 2.25;
    camera.updateProjectionMatrix();
    requestDraw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) requestDraw(); });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', requestDraw);
  const lost = (event: Event) => { event.preventDefault(); canvas.dispatchEvent(new CustomEvent('scene-unavailable')); };
  canvas.addEventListener('webglcontextlost', lost);
  let outdoor: THREE.Texture | undefined;
  new RGBELoader().load('/materials/park-sunset.hdr', texture => {
    if (disposed) { texture.dispose(); return; }
    texture.mapping = THREE.EquirectangularReflectionMapping;
    outdoor = texture;
    scene.environment = texture;
    scene.environmentRotation.y = 1.8;
    requestDraw();
  }, undefined, () => undefined);
  const pointerMove = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * .75;
    pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * -.35;
    requestDraw();
  };
  const pointerLeave = () => { pointerX = 0; pointerY = 0; requestDraw(); };
  canvas.addEventListener('pointermove', pointerMove, { passive: true });
  canvas.addEventListener('pointerleave', pointerLeave);
  resize();
  return {
    update(value: number) { progress = value; requestDraw(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', requestDraw);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      house.dispose(); target.dispose(); outdoor?.dispose(); renderer.dispose();
    },
  };
}
