import * as THREE from 'three';
import { growthAt } from './constructionTimeline';

type BuildPart = { mesh: THREE.Mesh; start: number; end: number; axis: 'x' | 'y' | 'z'; size: number; center: number };
/** One consistent building. Every animated solid grows from its own construction base. */
export function createConstructionHouse(onTextureReady: () => void = () => undefined) {
  const root = new THREE.Group();
  const parts: BuildPart[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures: THREE.Texture[] = [];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(unit);

  function texture(kind: 'concrete' | 'stone' | 'wood' | 'soil') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const colors = { concrete: '#b4b2a9', stone: '#d5cec0', wood: '#936747', soil: '#747162' };
    ctx.fillStyle = colors[kind];
    ctx.fillRect(0, 0, 512, 512);
    let seed = 29;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 15000; i++) {
      ctx.fillStyle = `rgba(${random() > .5 ? '255,255,255' : '30,25,20'},${random() * .1})`;
      const x = random() * 512, y = random() * 512;
      ctx.fillRect(x, y, kind === 'wood' ? .4 + random() * 2 : 1 + random() * 3, kind === 'wood' ? 8 + random() * 70 : 1 + random() * 2);
    }
    if (kind === 'concrete') {
      ctx.strokeStyle = 'rgba(45,45,40,.12)';
      for (let y = 0; y < 512; y += 85) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    textures.push(map);
    return map;
  }
  const surface = (color: number, roughness: number, map?: THREE.Texture, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, map, bumpMap: map, bumpScale: .025 });
    materials.add(m);
    return m;
  };
  let disposed = false;
  const loadMap = (path: string, color = false) => {
    const map = new THREE.TextureLoader().load(path, () => { if (!disposed) onTextureReady(); });
    if (color) map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    textures.push(map);
    return map;
  };
  const concreteColor = loadMap('/materials/concrete-color.jpg', true);
  const concreteNormal = loadMap('/materials/concrete-normal.jpg');
  const concrete = surface(0xb4b0a4, .88, concreteColor);
  concrete.normalMap = concreteNormal;
  concrete.normalScale.set(.45, .45);
  const stone = surface(0xb9b1a0, .68, concreteColor);
  stone.normalMap = concreteNormal;
  stone.normalScale.set(.2, .2);
  const wood = surface(0x926139, .67, loadMap('/materials/wood-color.jpg', true));
  wood.normalMap = loadMap('/materials/wood-normal.jpg');
  wood.normalScale.set(.4, .4);
  const soil = surface(0x48534a, 1, texture('soil'));
  const black = surface(0x232b29, .32, undefined, .65);
  const steel = surface(0x66564a, .7, undefined, .55);
  const plaster = surface(0xbabbb2, .85);
  const fabric = surface(0xa59883, .98);
  const green = surface(0x435444, .94);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x81989c, roughness: .12, metalness: .25, transparent: true, opacity: .58, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.3 });
  materials.add(glass);
  const warm = new THREE.MeshStandardMaterial({ color: 0xffddb0, emissive: 0xffc47e, emissiveIntensity: 1.5 });
  materials.add(warm);

  const box = (m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, start = -1, end = 0, axis: 'x' | 'y' | 'z' = 'y') => {
    const mesh = new THREE.Mesh(unit, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = m !== glass;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (start >= 0) parts.push({ mesh, start, end, axis, size: mesh.scale[axis], center: mesh.position[axis] });
    return mesh;
  };

  // Ground plane extends beyond the camera: no floating miniature pedestal.
  box(soil, 0, -.2, 0, 100, .3, 100);
  box(concrete, 0, .06, 0, 11.4, .3, 6.8);
  for (const x of [-5, 0, 5]) box(concrete, x, .23, 0, .5, .22, 6.4);
  for (const z of [-3, 3]) box(concrete, 0, .23, z, 10.5, .22, .5);

  // Small starter bars remain embedded inside the columns after casting.
  for (const x of [-5, 0, 5]) for (const z of [-3, 3]) {
    for (const offset of [-.1, .1]) box(steel, x + offset, .65, z + offset, .018, .95, .018);
  }
  // 1: supporting columns, beams, then slab. 2: repeat above the completed slab.
  for (let level = 0; level < 2; level++) {
    const base = .3 + level * 3.1;
    const begin = level === 0 ? .10 : .34;
    for (const [i, x] of [-5, 0, 5].entries()) for (const z of [-3, 3]) {
      box(concrete, x, base + 1.4, z, .32, 2.8, .32, begin + i * .006, begin + .12 + i * .006);
    }
    for (const z of [-3, 3]) box(concrete, 0, base + 2.8, z, 10.4, .3, .34, begin + .12, begin + .17, 'x');
    for (const x of [-5, 0, 5]) box(concrete, x, base + 2.8, 0, .34, .3, 6.4, begin + .12, begin + .17, 'z');
    box(concrete, 0, base + 3, .2, 11, .25, 7, begin + .17, begin + .23, 'x');
  }

  // Walls are built from their respective floor level, leaving genuine openings.
  for (let level = 0; level < 2; level++) {
    const base = .3 + level * 3.1;
    const start = .56 + level * .045;
    box(plaster, 0, base + 1.4, -3, 10, 2.8, .23, start, start + .08);
    box(stone, -5, base + 1.4, 0, .26, 2.8, 6.2, start, start + .08);
    // Solid corner and narrow central core, with glazed bays on each side.
    box(stone, -4.15, base + 1.4, 3, 1.7, 2.8, .3, start, start + .08);
    box(plaster, .3, base + 1.4, 3, 1.15, 2.8, .25, start, start + .08);
    box(plaster, 5, base + 1.4, -2.2, .26, 2.8, 1.6, start, start + .08);
    box(plaster, -.25, base + 1.4, -1.2, .18, 2.8, 3.5, start, start + .08);
    box(plaster, 0, base + 2.62, 3, 10, .36, .25, start + .04, start + .08);
  }
  // Finished parapet, roof cap and projecting soffit.
  box(stone, 0, 6.64, .2, 11.2, .32, 7.2, .68, .73, 'x');
  box(black, 0, 6.46, .2, 11.24, .045, 7.24, .71, .74, 'x');

  // Glazing: individual frames install only after the walls.
  function windowBay(x: number, base: number, z: number, width: number) {
    const start = .74 + base * .003;
    box(glass, x, base + 1.22, z, width, 2.38, .035, start, start + .09);
    for (const dx of [-width / 2, 0, width / 2]) box(black, x + dx, base + 1.22, z + .015, .048, 2.44, .09, start, start + .07);
    for (const y of [base, base + 2.44]) box(black, x, y, z + .015, width + .05, .045, .09, start + .04, start + .08, 'x');
    box(black, x + .08, base + 1.05, z + .08, .025, .22, .03, start + .07, start + .09);
  }
  for (const base of [.35, 3.45]) {
    windowBay(-1.95, base, 3.03, 2.65);
    windowBay(2.8, base, 3.03, 3.65);
    // Side glazing and visible mullions.
    box(glass, 5.04, base + 1.22, .7, .035, 2.38, 4.3, .76, .83);
    for (const z of [-1.4, 0, 1.4, 2.8]) box(black, 5.06, base + 1.22, z, .07, 2.44, .045, .76, .82);
  }
  // Tall timber facade, recessed entrance, stone joints.
  for (let i = 0; i < 13; i++) box(wood, -.2 + i * .085, 3.35, 3.2, .045, 6.05, .13, .82 + i * .001, .89 + i * .001);
  box(wood, .34, 1.45, 3.17, .83, 2.3, .08, .81, .87);
  box(black, .65, 1.45, 3.24, .025, .55, .03, .87, .89);
  for (let i = 0; i < 5; i++) box(concrete, -4.15, 1 + i * 1.05, 3.16, 1.65, .012, .012, .85, .9, 'x');
  // Balcony cantilever and fine glass balustrade.
  box(stone, 2.65, 3.35, 3.63, 4.25, .17, 1.3, .84, .9, 'x');
  box(glass, 2.65, 3.97, 4.25, 4.2, 1.06, .035, .88, .92);
  for (const x of [.6, 2.65, 4.7]) box(black, x, 3.96, 4.25, .025, 1.06, .04, .87, .91);
  box(black, 2.65, 4.51, 4.25, 4.24, .027, .035, .9, .92, 'x');

  // Real-scale interior furnishings seen through the glazing.
  for (const y of [.35, 3.45]) {
    box(wood, 0, y, 0, 9.7, .04, 5.7, .83, .87, 'x');
    box(fabric, -2.2, y + .28, 1.1, 2.3, .42, .95, .89, .93);
    box(fabric, -2.2, y + .65, .68, 2.3, .53, .16, .89, .93);
    box(stone, -2.2, y + .2, 2.05, 1.1, .2, .6, .9, .94);
    box(wood, 2.7, y + .76, .9, 1.6, .1, .8, .89, .93);
    for (const x of [2.05, 3.35]) box(black, x, y + .37, .9, .06, .74, .6, .88, .92);
    box(wood, 2.6, y + .52, -2.6, 4, 1.04, .55, .88, .93);
    box(warm, -2.2, y + 2.53, 1.5, 2.3, .025, .025, .94, .98, 'x');
  }
  // Ground-level finishes spread out only near completion.
  for (let row = 0; row < 5; row++) for (let col = 0; col < 9; col++) {
    box(stone, -5.1 + col * 1.28, -.01, 4.4 + row * .92, 1.26, .09, .90, .9 + row * .006, .97 + row * .006, 'z');
  }
  for (let step = 0; step < 3; step++) box(stone, .25, .23 - step * .08, 3.5 + step * .3, 2.2, .12, .32, .88, .94, 'x');

  // A deeper timber bay and slatted terrace canopy break the facade massing.
  box(wood, -4.18, 4.92, 3.2, 1.64, 2.55, .12, .81, .9);
  for (let i = 0; i < 17; i++) box(black, -4.95 + i * .096, 4.92, 3.27, .009, 2.55, .014, .84, .91);
  for (let i = 0; i < 14; i++) box(wood, 1.15 + i * .28, 3.13, 3.9, .08, .14, 1.6, .84, .9, 'z');

  // Instanced leaves replace the rounded placeholder bushes.
  const leaf = new THREE.SphereGeometry(1, 6, 4);
  geometries.add(leaf);
  const dummy = new THREE.Object3D();
  const leaves = new THREE.InstancedMesh(leaf, green, 980);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  root.add(leaves);
  let seed = 301;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let leafIndex = 0;
  for (const x of [-6.3, 6.7]) {
    box(stone, x, .15, .6, 1.15, .3, 5, .9, .95, 'z');
    for (let i = 0; i < 7; i++) for (let j = 0; j < 70; j++) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * .54;
      dummy.position.set(x + Math.cos(angle) * radius, .4 + rand() * .55, -1.5 + i * .64 + Math.sin(angle) * radius);
      dummy.rotation.set(rand() * 2, angle, rand());
      dummy.scale.set(.045 + rand() * .07, .015, .13 + rand() * .1);
      dummy.updateMatrix();
      leaves.setMatrixAt(leafIndex++, dummy.matrix);
    }
  }
  leaves.instanceMatrix.needsUpdate = true;
  parts.push({ mesh: leaves, start: .92, end: 1, axis: 'y', size: 1, center: 0 });
  for (const x of [-4, 1.5, 4]) {
    box(black, x, 2.6, 3.2, .13, .2, .12, .89, .94);
    box(warm, x, 2.48, 3.22, .1, .02, .1, .95, 1);
  }
  function setProgress(progress: number) {
    for (const item of parts) {
      const amount = growthAt(progress, item.start, item.end);
      item.mesh.visible = amount > .0001;
      item.mesh.scale[item.axis] = Math.max(.0001, item.size * amount);
      item.mesh.position[item.axis] = item.center - item.size * (1 - amount) / 2;
    }
  }
  setProgress(0);
  return { root, setProgress, dispose() { disposed = true; leaves.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); } };
}
