export type Project = {
  slug: string;
  title: string;
  category: string;
  location: string;
  area: string;
  duration: string;
  model: string;
  budget: string;
  year: string;
  introduction: string;
  images: { src: string; alt: string; caption: string }[];
};

// Illustrative portfolio records based on the supplied page. Replace with approved project facts and photography.
export const projects: Project[] = [
  {
    slug: 'cantilever-residence', title: 'Modern Cantilever Residence', category: 'Construction + glazing',
    location: 'Trichy, Tamil Nadu', area: '8,400 sq ft', duration: '18 months',
    model: 'Turnkey residence', budget: '₹4.8 Cr', year: '2024',
    introduction: 'A study in structural clarity: an upper volume appears to float over a glazed living level, with landscape and warm interiors grounding the composition.',
    images: [
      { src: '/images/project-villa.webp', alt: 'Contemporary cantilevered villa exterior', caption: 'Exterior study' },
      { src: '/images/structure.webp', alt: 'Concrete building structure under construction', caption: 'Structural language' },
      { src: '/images/windows.webp', alt: 'Large glazed opening toward the landscape', caption: 'Glazing detail' },
    ],
  },
  {
    slug: 'minimalist-penthouse', title: 'Minimalist Penthouse', category: 'Interiors',
    location: 'Chennai, Tamil Nadu', area: '3,800 sq ft', duration: '9 months',
    model: 'Interior fit-out', budget: '₹1.6 Cr', year: '2024',
    introduction: 'Quiet materials, low furniture, and carefully aligned joinery create a calm setting for everyday life above the city.',
    images: [
      { src: '/images/penthouse.webp', alt: 'Warm contemporary penthouse interior', caption: 'Living room' },
      { src: '/images/interiors.webp', alt: 'Modern interior with timber and stone finishes', caption: 'Material palette' },
    ],
  },
  {
    slug: 'monolith-villa', title: 'The Monolith Villa', category: 'Complete ecosystem',
    location: 'Coimbatore, Tamil Nadu', area: '11,200 sq ft', duration: '22 months',
    model: 'Design and build', budget: '₹7.2 Cr', year: '2024',
    introduction: 'An integrated residence concept connecting a strong exterior silhouette, finely detailed rooms, and generous openings to an outdoor terrace.',
    images: [
      { src: '/images/villa-hero.webp', alt: 'Modern villa illuminated at dusk', caption: 'Arrival view' },
      { src: '/images/terrace.webp', alt: 'Covered terrace opening to the landscape', caption: 'Terrace' },
      { src: '/images/comparison-after.webp', alt: 'Finished living space with architectural glazing', caption: 'Living space' },
    ],
  },
  {
    slug: 'courtyard-pavilion', title: 'Courtyard Pavilion', category: 'Architecture + windows',
    location: 'Bengaluru, Karnataka', area: '5,600 sq ft', duration: '12 months',
    model: 'Pavilion and glazing', budget: '₹2.4 Cr', year: '2023',
    introduction: 'A light garden pavilion concept where slim window profiles and sheltered outdoor rooms bring the landscape into view.',
    images: [
      { src: '/images/pavilion.webp', alt: 'Contemporary garden pavilion', caption: 'Garden elevation' },
      { src: '/images/windows.webp', alt: 'Full-height glazed opening', caption: 'Precision glazing' },
    ],
  },
];
