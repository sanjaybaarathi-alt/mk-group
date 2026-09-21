# MK Group of Companies frontend

React, TypeScript, Vite, Tailwind CSS and GSAP implementation of the supplied Stitch page.

## Run

```sh
npm install
npm run dev
```

Use `npm run build`, `npm run lint`, and `npm run test` for checks.

`initialCut.html` remains the approved visual source. `scripts/extract-design.mjs` extracts its Tailwind theme, custom CSS, and ecosystem content. Run it after changing those source sections. `HomeScreen.tsx` maps the preserved markup to React controls; `HomeScreen.vm.ts` owns interaction and form state. This keeps the initial visual conversion traceable to the approved HTML.

Site photos are local WebP assets mapped in `imageAssets.ts`. Full-resolution source PNGs are in `assets/source-images/`; run `node scripts/optimize-images.mjs` after editing them. Division SVG marks in `public/logos/` are interpretations of the supplied logo sheet; replace them with official vector files when available. The interactive build study and its ThreeUI reference are documented in [docs/threeui-motion-reference.md](docs/threeui-motion-reference.md). The page-wide animation and design references are in [docs/motion-direction.md](docs/motion-direction.md).

The landing hero uses a short architectural aperture and masked headline reveal over its project photograph. The same aperture geometry introduces the three business photographs. The interactive Three.js house remains in the ecosystem section, where it loads near the viewport and pauses when offscreen.

The Precision Windows demonstration uses a reversible GSAP ScrollTrigger timeline pinned to scroll. One uPVC sash slides left on a two-track frame; reflection, daylight, and copy follow the same progress. Reduced-motion visitors see the open state without pinning. Its clean terrace plate at `public/images/window-open-plate.webp` is an illustrative generated edit of the existing terrace image, not a verified product photograph.

The portfolio section links to individual case study pages at `#/projects/<slug>`. A selected card photograph expands into the detail hero when motion is enabled; reduced-motion navigation is immediate. Edit [src/ui/projects/projects.ts](src/ui/projects/projects.ts) to add projects, photo galleries, and verified facts. The four current records and their budgets, durations, and images are **illustrative sample content**. Each page labels them clearly for the preview. The gallery uses pointer-responsive perspective cards, and each case study offers a selectable image set and project particulars.

The enquiry form opens WhatsApp Click to Chat with a prefilled service-specific message. The visitor reviews the message and presses Send in WhatsApp; the site does not send or store enquiries. The configured destination is `919344237897` (provided by MK); override it with `VITE_WHATSAPP_NUMBER` in `.env.local` if the business number changes. The business claims, project descriptions, office locations, testimonial, and warranty terms in the supplied design need review before public launch.

The enquiry estimator starts construction at 500 sq ft. Construction rates are Standard ₹2,000, Premium ₹2,300, and Luxury ₹3,000 per built-up sq ft. Interior packages are Glossy ₹360, Texture ₹390, Magma ₹450, Gold ₹500, and Diamond ₹520 per sq ft. uPVC options are Sliding (2-track / 3-track) ₹390, Sliding with mesh ₹430, Openable ₹490, Openable with mesh ₹530, and Fixed ₹45 per sq ft. Each service has its own area control, and selected services add together. All totals remain indicative until MK issues a formal quotation.

## Preview hosting

The static React/Vite site can be hosted on Cloudflare Pages without a form server. For automatic deployments, connect the `main` branch of `sanjaybaarathi-alt/mk-group` in **Workers & Pages → Create application → Pages → Connect to Git**. Use build command `npm run build`, output directory `dist`, and the repository root as the root directory. Cloudflare will redeploy after each push to `main`. The labeled sample portfolio content remains visible until verified project material is available. The current `#/projects/...` routes work on static hosting; search-friendly service and project URLs are a separate SEO improvement.
