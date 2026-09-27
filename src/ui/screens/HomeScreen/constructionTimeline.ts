export const constructionPhases = [
  { start: 0, label: 'Foundation', title: 'Every landmark begins below the surface.', detail: 'Reinforced foundations establish the footprint and carry the load.' },
  { start: .12, label: 'Ground floor', title: 'Built from the ground up.', detail: 'Columns rise from their bases. Beams connect, then the first floor is cast.' },
  { start: .34, label: 'Upper floor', title: 'One level. Then the next.', detail: 'The upper structure grows only after the supporting floor is in place.' },
  { start: .56, label: 'Walls & roof', title: 'Space takes its shape.', detail: 'Walls rise within the frame. The roof closes the building above them.' },
  { start: .73, label: 'Windows & finishes', title: 'Precision in every detail.', detail: 'Glazing, stone and timber complete the architectural envelope.' },
  { start: .91, label: 'Complete', title: 'Ready for life to unfold.', detail: 'Terraces, planting and warm interior details complete the home.' },
] as const;

export function phaseAt(progress: number) {
  let phase = 0;
  constructionPhases.forEach((item, index) => { if (progress >= item.start) phase = index; });
  return phase;
}

export function growthAt(progress: number, start: number, end: number) {
  const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
  return local * local * (3 - 2 * local);
}

