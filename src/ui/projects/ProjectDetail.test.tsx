// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ProjectDetail } from './ProjectDetail.tsx';
import { ProjectGallery } from './ProjectGallery.tsx';

beforeAll(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('project archive', () => {
  it('links every sample project to an individual page', () => {
    render(<ProjectGallery />);
    expect(screen.getAllByRole('link', { name: /case study/i })).toHaveLength(4);
    expect(screen.getByRole('link', { name: /Monolith Villa case study/i })).toHaveAttribute('href', '#/projects/monolith-villa');
    expect(screen.getByText(/illustrative samples/i)).toBeInTheDocument();
  });

  it('shows project particulars and switches selected gallery image', () => {
    render(<ProjectDetail slug="monolith-villa" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Monolith Villa');
    expect(screen.getByText('11,200 sq ft')).toBeInTheDocument();
    expect(screen.getByText('₹7.2 Cr')).toBeInTheDocument();
    const image = screen.getByAltText('Modern villa illuminated at dusk');
    expect(image).toHaveAttribute('src', '/images/villa-hero.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Show Terrace' }));
    expect(screen.getByAltText('Covered terrace opening to the landscape')).toHaveAttribute('src', '/images/terrace.webp');
  });

  it('carries the selected card image into its detail hero', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const gallery = render(<ProjectGallery />);
    fireEvent.click(screen.getByRole('link', { name: /Monolith Villa case study/i }));
    expect(window.location.hash).toBe('#/projects/monolith-villa');
    expect(document.querySelector('.mk-project-transition img')).toHaveAttribute('src', '/images/villa-hero.webp');
    gallery.unmount();
    render(<ProjectDetail slug="monolith-villa" />);
    await waitFor(() => expect(document.querySelector('.mk-project-transition')).not.toBeInTheDocument(), { timeout: 2500 });
    expect(document.querySelector('.mk-detail__hero img')).toHaveAttribute('src', '/images/villa-hero.webp');
    window.location.hash = '';
  });
});
