import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Material = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

function surfaceTexture(kind: 'stone' | 'wood' | 'concrete'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const base = kind === 'wood' ? '#a9784c' : kind === 'stone' ? '#d7c9ae' : '#c9c5b9';
  context.fillStyle = base;
  context.fillRect(0, 0, 256, 256);
  let seed = kind === 'wood' ? 41 : kind === 'stone' ? 97 : 13;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 1100; i++) {
    const x = random() * 256, y = random() * 256;
    context.strokeStyle = kind === 'wood' ? `rgba(61,33,17,${random() * .15})` : `rgba(82,75,64,${random() * .09})`;
    context.lineWidth = random() * 1.6;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (kind === 'wood' ? random() * 110 : random() * 12), y + random() * 2);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function createHouseStudy() {
  const world = new THREE.Group();
  const house = new THREE.Group();
  world.add(house);
  const parts = Array.from({ length: 4 }, () => new THREE.Group());
  parts.forEach((part) => house.add(part));
  const textures = [surfaceTexture('concrete'), surfaceTexture('stone'), surfaceTexture('wood')];
  const concrete = new THREE.MeshStandardMaterial({ color: 0xdfdcd5, map: textures[0], bumpMap: textures[0], bumpScale: .018, roughness: .88 });
  const limestone = new THREE.MeshStandardMaterial({ color: 0xf2e7d2, map: textures[1], bumpMap: textures[1], bumpScale: .01, roughness: .72 });
  const roofStone = new THREE.MeshStandardMaterial({ color: 0xb2ada1, map: textures[1], bumpMap: textures[1], bumpScale: .012, roughness: .84 });
  const timber = new THREE.MeshStandardMaterial({ color: 0xc28d5b, map: textures[2], bumpMap: textures[2], bumpScale: .008, roughness: .58 });
  const walnut = new THREE.MeshStandardMaterial({ color: 0x76503a, map: textures[2], bumpMap: textures[2], bumpScale: .008, roughness: .5 });
  const plaster = new THREE.MeshStandardMaterial({ color: 0xf3efe5, roughness: .87 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x263330, metalness: .43, roughness: .4 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x9a704a, metalness: .7, roughness: .28 });
  const upholstery = new THREE.MeshPhysicalMaterial({ color: 0xd6c4ab, roughness: .92, sheen: .35, sheenRoughness: .85, sheenColor: 0xe1cbb0 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe9dfcf, roughness: .9 });
  const olive = new THREE.MeshStandardMaterial({ color: 0x53624a, roughness: 1 });
  const rust = new THREE.MeshStandardMaterial({ color: 0xac6b4c, roughness: .87 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x536d79, roughness: .72 });
  const leafGreen = new THREE.MeshStandardMaterial({ color: 0x718255, roughness: 1 });
  const soil = new THREE.MeshStandardMaterial({ color: 0x43493e, roughness: 1 });
  const water = new THREE.MeshPhysicalMaterial({ color: 0x6c9da3, metalness: .08, roughness: .11, clearcoat: .9, clearcoatRoughness: .06, transparent: true, opacity: .78 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xc7dbd8, metalness: .04, roughness: .05, clearcoat: .95, clearcoatRoughness: .04, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false });
  const glow = new THREE.MeshStandardMaterial({ color: 0xffddb0, emissive: 0xffb96c, emissiveIntensity: 2.1, roughness: .3 });
  const materials: Material[] = [concrete, limestone, roofStone, timber, walnut, plaster, charcoal, bronze, upholstery, ivory, olive, rust, blue, leafGreen, soil, water, glass, glow];
  const geometries: THREE.BufferGeometry[] = [];

  const mesh = (parent: THREE.Group, geometry: THREE.BufferGeometry, material: Material, x: number, y: number, z: number) => {
    geometries.push(geometry);
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = material !== glass && material !== water;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (part: number, material: Material, w: number, h: number, d: number, x: number, y: number, z: number, radius = 0) =>
    mesh(parts[part], radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const cylinder = (part: number, material: Material, radius: number, height: number, x: number, y: number, z: number, sides = 16) =>
    mesh(parts[part], new THREE.CylinderGeometry(radius, radius, height, sides), material, x, y, z);

  // 01 — raft, cantilever, columns, and a partial structural frame.
  const site = mesh(world, new THREE.BoxGeometry(9.2, .18, 6.8), soil, 0, -.99, 0);
  site.receiveShadow = true;
  box(0, concrete, 6.6, .26, 4.65, 0, -.72, 0);
  box(0, limestone, 6.45, .07, 4.5, 0, -.54, 0);
  for (const x of [-3.02, 3.02]) for (const z of [-2.05, 2.05]) box(0, concrete, .18, 3.03, .18, x, 1.03, z);
  box(0, concrete, 6.38, .18, .22, 0, 2.51, -2.03);
  box(0, concrete, .19, .18, 4.4, -3.02, 2.51, 0);
  box(0, concrete, 3.15, .15, 2.12, -1.53, 2.58, -1.13);
  box(0, concrete, 6.7, .11, .22, 0, -.48, 2.34);

  // 02 — a furnished living room, dining room, and compact kitchen.
  box(1, timber, 6.38, .035, 4.45, 0, -.48, 0);
  box(1, plaster, 6.2, 2.78, .14, 0, .92, -2.2);
  box(1, plaster, .14, 2.78, 4.22, -3.15, .92, 0);
  box(1, walnut, 2.1, 2.22, .08, -1.7, .67, -2.09);
  for (let x = -2.68; x < -.75; x += .16) box(1, bronze, .018, 2.16, .03, x, .67, -2.03);
  box(1, ivory, .77, .95, .025, -.14, 1.08, -2.09);
  box(1, rust, .31, .69, .027, -.31, 1.03, -2.06);
  box(1, blue, .2, .44, .03, .05, 1.12, -2.055);
  box(1, limestone, 2.25, .12, .47, 1.82, .16, -1.85);
  for (const x of [.86, 1.42, 1.98, 2.54]) box(1, walnut, .52, 1.1, .44, x, .13, -1.93);
  box(1, limestone, 1.55, .1, .78, 1.65, .47, -.98);
  box(1, walnut, 1.44, .55, .65, 1.65, .14, -.98);
  // Lounge suite, side tables, rug, and low stone table.
  box(1, ivory, 3.04, .025, 2.17, -1.22, -.445, .25);
  box(1, upholstery, 1.92, .42, .82, -1.63, -.13, -.3, .1);
  box(1, upholstery, 1.92, .65, .18, -1.63, .34, -.67, .07);
  for (const x of [-2.54, -.73]) box(1, upholstery, .18, .55, .85, x, .04, -.3, .06);
  box(1, rust, .38, .3, .13, -2.16, .28, -.43, .05);
  box(1, blue, .36, .3, .13, -1.13, .28, -.43, .05);
  box(1, upholstery, .86, .4, .82, -.28, -.13, .82, .09);
  box(1, upholstery, .86, .6, .16, -.28, .31, 1.12, .05);
  cylinder(1, walnut, .49, .09, -1.37, -.08, .86, 24);
  cylinder(1, bronze, .035, .32, -1.37, -.26, .86);
  cylinder(1, limestone, .18, .04, -1.45, -.005, .78, 24);
  cylinder(1, blue, .045, .16, -1.11, .06, .84, 12);
  cylinder(1, walnut, .22, .08, .51, -.04, .65);
  // Dining table and six upholstered chairs.
  box(1, walnut, 1.8, .1, .93, 1.66, .09, .78, .035);
  cylinder(1, limestone, .22, .025, 1.66, .158, .78, 24);
  cylinder(1, rust, .055, .13, 1.66, .23, .78, 16);
  for (const x of [.92, 2.4]) for (const z of [.47, 1.1]) cylinder(1, bronze, .025, .51, x, -.21, z, 8);
  for (const x of [1.05, 1.7, 2.35]) for (const z of [.06, 1.49]) {
    box(1, upholstery, .38, .12, .35, x, -.16, z, .04);
    box(1, walnut, .38, .48, .06, x, .15, z + (z > 1 ? .18 : -.18), .025);
  }
  // Pendant lights and two indoor trees.
  for (const x of [.95, 2.35]) {
    cylinder(1, charcoal, .012, .85, x, 1.86, .78, 8);
    cylinder(1, bronze, .24, .17, x, 1.33, .78, 24);
    cylinder(1, glow, .15, .018, x, 1.23, .78, 24);
  }
  for (const [x, z] of [[-2.72, 1.66], [2.82, -1.56]]) {
    cylinder(1, limestone, .17, .35, x, -.28, z);
    cylinder(1, walnut, .025, .64, x, .2, z, 8);
    for (let i = 0; i < 11; i++) {
      const leaf = mesh(parts[1], new THREE.SphereGeometry(.2, 8, 6), i % 3 ? olive : leafGreen,
        x + Math.sin(i * 2.4) * (.13 + (i % 3) * .08), .49 + (i % 4) * .12, z + Math.cos(i * 2.4) * .19);
      leaf.scale.set(.52, .35, 1.2);
      leaf.rotation.z = Math.sin(i * 2.4) * .45;
    }
  }
  box(1, glow, 5.6, .018, .025, 0, 2.25, -2.1);

  // 03 — slim-profile sliding envelope with distinct glass leaves and recessed tracks.
  for (const x of [-3.04, -1.51, 0, 1.51, 3.04]) box(2, charcoal, .055, 2.75, .08, x, .94, 2.21);
  for (const y of [-.44, 2.32]) box(2, charcoal, 6.14, .055, .1, 0, y, 2.21);
  for (const x of [-2.275, -.755, .755, 2.275]) box(2, glass, 1.45, 2.65, .025, x, .94, 2.21);
  for (const x of [-1.51, 1.51]) box(2, bronze, .018, .26, .045, x + .07, .72, 2.27);
  for (const z of [-1.55, -.65, .25, 1.15]) box(2, charcoal, .045, 2.76, .055, 3.08, .94, z);
  box(2, glass, .025, 2.65, 3.55, 3.08, .94, -.2);
  box(2, bronze, 6.2, .02, .1, 0, -.46, 2.32);

  // 04 — a floating roof with a real skylight opening, planted roof edge, and terrace.
  const roofSections = [
    [-1.45, -1.19, 3.9, 2.42],
    [2.7, -1.19, 1.4, 2.42],
    [1.25, -2.1, 1.5, .6],
    [1.25, -.35, 1.5, .74],
  ] as const;
  for (const [x, z, width, depth] of roofSections) {
    box(3, charcoal, width, .16, depth, x, 2.76, z);
    box(3, roofStone, width, .055, depth, x, 2.86, z);
  }
  // A raised glazed curb keeps the opening legible from the exterior view.
  for (const x of [.5, 2]) box(3, charcoal, .055, .09, 1.12, x, 2.91, -1.25);
  for (const z of [-1.81, -.69]) box(3, charcoal, 1.55, .09, .055, 1.25, 2.91, z);
  box(3, glass, 1.43, .025, 1.02, 1.25, 2.91, -1.25);
  box(3, bronze, .025, .018, 1.02, 1.25, 2.93, -1.25);
  // Fine joints and a planted trough give the otherwise broad roof a useful scale.
  for (const x of [-2.65, -1.85, -1.05, -.25]) box(3, concrete, .014, .008, 2.18, x, 2.893, -1.19);
  box(3, charcoal, 1.78, .15, .38, -2.25, 2.98, -2.08);
  box(3, soil, 1.64, .018, .26, -2.25, 3.07, -2.08);
  for (const x of [-2.91, -2.62, -2.33, -2.04, -1.75, -1.58]) {
    const shrub = mesh(parts[3], new THREE.SphereGeometry(.18, 9, 7), leafGreen, x, 3.17, -2.08);
    shrub.scale.set(1, .7, .7);
  }
  box(3, timber, 2.08, .11, 1.85, -2.2, 2.83, 1.32);
  for (let x = -3.05; x <= -1.24; x += .19) box(3, walnut, .055, 2.39, .11, x, 1.03, -2.12);
  box(3, limestone, 6.75, .14, 1.22, 0, -.72, 2.94);
  for (let i = 0; i < 3; i++) box(3, limestone, 3.2 + i * .35, .11, .31, -1.72, -.83 - i * .075, 3.66 + i * .3);
  box(3, charcoal, 2.4, .08, 1.16, 2.95, -.8, 3.04);
  box(3, water, 2.25, .025, 1.02, 2.95, -.748, 3.04);
  for (let i = 0; i < 9; i++) {
    const x = -4.12 + i * 1.02;
    cylinder(3, olive, .2 + (i % 3) * .045, .24, x, -.73, -2.75, 9);
  }
  for (const x of [-2.7, 2.7]) box(3, glow, .18, .055, .07, x, 2.56, 2.13);

  return {
    world, house, parts,
    dispose: () => {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
