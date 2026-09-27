# MK Group of Companies frontend

Production-oriented React, TypeScript, Vite, GSAP and Three.js website for MK Group of Companies.

## Run locally

```sh
npm install
npm run dev
```

Quality gates:

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Architecture

- `src/ui/screens/HomeScreen/` contains the landing page, enquiry ViewModel, construction hero and Precision Windows interaction.
- `src/ui/projects/` contains the concept portfolio and project detail route.
- `src/tokens.css` contains shared visual and motion tokens.
- `src/app.css` contains global foundations.
- Component-specific styles remain colocated with their React components.
- Manrope, Newsreader and JetBrains Mono are self-hosted through Fontsource.
- Three.js loads dynamically only when the scroll-built construction hero can run.
- Reduced-motion visitors and browsers without WebGL receive the static completed-home image.

The construction hero implementation and material licensing are documented in [docs/construction-hero.md](docs/construction-hero.md). Page-wide motion principles are documented in [docs/motion-direction.md](docs/motion-direction.md).

## Portfolio content

The current records in [src/ui/projects/projects.ts](src/ui/projects/projects.ts) are explicitly presented as **concept studies**. Their locations, areas, dates, durations and indicative budgets must be replaced with approved MK project information before they are presented as completed work. Project routes use `/projects/<slug>` and are supported on static hosting by `public/_redirects`.

## Enquiry flow

The enquiry form:

- Validates contact fields inline.
- Calculates construction, interior and uPVC estimates independently.
- Combines selected services into one indicative total.
- Opens WhatsApp Click to Chat with a prefilled message.
- Does not silently send or store customer information.

The WhatsApp destination defaults to `919344237897`. Override it with `VITE_WHATSAPP_NUMBER` in `.env.local`.

Current rates:

- Construction: Standard ₹2,000, Premium ₹2,300, Luxury ₹3,000 per built-up sq ft.
- Interiors: Glossy ₹360, Texture ₹390, Magma ₹450, Gold ₹500, Diamond ₹520 per sq ft.
- uPVC: Sliding ₹390, Sliding with mesh ₹430, Openable ₹490, Openable with mesh ₹530, Fixed ₹45 per sq ft.

All totals are planning estimates until MK issues a formal quotation.

## Team photographs

Place approved engineer portraits at:

```text
public/images/team/praveen.webp
public/images/team/dhilip-kumar.webp
```

Until those assets are supplied, the enquiry panel uses initials and verified credentials.

## Hosting

For Cloudflare Pages or Vercel:

- Build command: `npm run build`
- Output directory: `dist`
- Node project root: repository root
- Production branch: `main`

Connect the GitHub repository for automatic deployment after each push.
