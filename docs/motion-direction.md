# MK motion direction

The motion system follows an architectural sequence: reveal the surface, assemble its parts, then settle into place. It uses the existing GSAP runtime and CSS transitions.

The visual direction also draws from [Landing Love's architecture collection](https://www.landing.love/categories/architecture/) and [GSAP collection](https://www.landing.love/collection/gsap/), alongside [CSS Design Awards' animated gallery](https://www.cssdesignawards.com/website-gallery?feature=animated). The adaptation uses a full-bleed architectural image, editorial spacing, a restrained viewfinder, and a consistent dark project gallery. It does not copy a reference site's code or assets.

- The [Jitter UI elements gallery](https://jitter.video/templates/ui-elements/) informed the comparison handle, tab response, and button feedback.
- [Motion's gesture, scroll, and timeline examples](https://motion.dev/) informed the responsive timing and staged transitions. The site already uses GSAP, so these patterns are implemented there rather than adding another animation runtime.
- The [Awwwards CSS and JS animation collection](https://www.awwwards.com/awwwards/collections/css-js-animations/) was supplied as a visual direction reference.
- [LottieFiles state machines](https://lottiefiles.com/state-machines) informed the idea of control-driven animation states. The project's controls and 3D model are native code, so no external Lottie asset or player is required.

The hero reveals its image and type in layers and responds lightly to pointer position. A discipline band links it to the editorial sections. The page header and top progress line react to scroll position, and the statistics count into view. The before/after comparison has a one-time reveal and direct pointer movement. Anchor navigation is eased. Stage images and details enter in sequence. Window sashes, project cards, timeline cards, and the 3D model respond to their respective controls. Reduced-motion preferences disable the decorative sequences.

## Project archive direction

The supplied [Vectr reference](https://www.landing.love/sites/vectrfl/) suggested a restrained dimensional moment rather than constant movement. [Huy Phan's portfolio](https://huyml.co/) informed the image-first pacing and transition into a dedicated project page. [Studio X's project pages](https://www.thisisstudiox.com/projects) informed the readable project metadata and selected-views structure. [World of NRG](https://www.landing.love/sites/worldofnrg/) informed the editorial hierarchy. The resulting MK gallery uses pointer-responsive 3D perspective cards, large local images, and individual case studies. It does not copy any reference site's code or assets.

## Landing assembly

The hero uses the original MK house study in a new Three.js scene. Its structure appears first, followed by furnished rooms, glazing, and the completed landscape. Visitors can select a stage and move the pointer to inspect the model. This turns MK's construction-to-completion story into the dimensional interaction; it uses the restrained 3D entry idea in [VectrFL](https://www.vectrfl.com/) and the process-led visual explanation in [ICOMAT](https://www.icomat.co.uk/) as conceptual references. The local hero photo remains the fallback when motion or WebGL is unavailable. The scene and controls are original to this project.
