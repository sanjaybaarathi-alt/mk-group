# Construction hero and motion review

The landing hero uses one procedural two-storey building with a fixed camera and stable footprint. It is a real-time architectural visualization rather than a photographic render or a surveyed MK project.

## Construction schedule

- The reinforced foundation is visible at entry.
- Ground-floor columns grow from their bases, followed by beams and the supporting slab.
- Upper-floor columns begin only after that slab is complete.
- Walls grow from their floor level and preserve window and door openings.
- Roof finish, individual frames, doors, facade details, balcony, interiors and landscaping follow.
- Each transform is a pure function of scroll progress. Reversing scroll reverses the build and stopping scroll stops the build.

## Design and performance

The layout keeps copy separate from the scene and exposes a skip link. Navigation stays in one fixed layout. Anchor movement has one GSAP controller. Long sections remain visible while compact headings receive restrained entry motion.

Three.js loads dynamically. Device pixel ratio is capped, geometry is shared, foliage is instanced, and the scene renders only after progress, resize, texture or visibility changes. Reduced motion and WebGL failure both use a static image and remove the long scroll duration.

## Material sources

These local runtime assets were downloaded from Poly Haven under CC0:

- [Rosendal Park Sunset](https://polyhaven.com/a/rosendal_park_sunset), by Dimitrios Savva and Jarod Guest: 1K HDR lighting.
- [Concrete Wall 008](https://polyhaven.com/a/concrete_wall_008), by Charlotte Baglioni and Dario Barresi: 1K diffuse and OpenGL normal maps.
- [Wood Planks Grey](https://polyhaven.com/a/wood_planks_grey): 1K diffuse and OpenGL normal maps.
- [Poly Haven license](https://polyhaven.com/license).

The production site loads these assets locally and does not depend on Poly Haven at runtime.

## Verification

Run `npm run test:e2e` with Microsoft Edge installed. The browser tests cover forward and reverse construction, pausing, skip navigation, mobile ecosystem motion, the unpinned mobile window interaction, enquiry validation, project metadata and focus, keyboard comparison control, reduced motion, and WebGL failure. Unit tests verify anchored column growth and construction order.

Photographic architectural quality would require an artist-authored model with baked lighting or a rendered image sequence exported from the same model. Independent generated photographs cannot maintain exact geometry between construction stages.
