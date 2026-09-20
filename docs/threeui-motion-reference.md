# MK architectural 3D journey

Reference: [ThreeUI browse](https://threeui.com/browse), specifically its [Dimensional Field catalog entry](https://github.com/MengTo/threeui/blob/main/src/data/shaders.tsx). The MK implementation adapts its responsive architectural depth idea with an original 3D assembly study in `ArchitecturalJourney.tsx`. It does not copy ThreeUI source.

## Adapted design prompt

> Create a full-width interactive architectural assembly study for MK Group. Let visitors select concrete structure, timber interior, precision glazing, and completed shell, then drag the model to inspect the relationship between the systems. Pair each phase with a brief explanation and synchronize it with the ecosystem photographs. Show the selected photograph when WebGL is unavailable or motion is reduced.

The model is decorative. The stage labels, text, photos, and buttons carry the complete information.

The current 3D house is a furnished **concept study**, not a surveyed MK project. It includes a concrete frame, textured stone and timber surfaces, lounge furniture, dining area, kitchen, indoor planting, sliding glazing, terrace, and landscape. Replace it with project-specific geometry and approved materials if architectural drawings become available.

The finished roof is divided around a glazed skylight opening and includes paving joints and a planted edge. This gives the upper surface readable detail while preserving the cutaway view into the furnished rooms.

## Realism and visual direction

The scene uses Three.js physically based materials, a generated [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html) for image based lighting, directional sunlight, soft shadows, surface bump, and selective clearcoat and fabric sheen. The [MeshPhysicalMaterial guidance](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) informed glass, water, and upholstery settings. This improves material legibility without adding a large third party model download. It remains a procedural concept rather than a photoreal architectural rendering.

The surrounding panel adapts the public [TypeUI Blueprint design skill](https://www.typeui.sh/design-skills/blueprint): measured rules, paper tone, architectural labels, and restrained contrast. MK's existing bronze and charcoal palette remains the brand anchor. Exterior and interior presets make the drag interaction easier to use.
