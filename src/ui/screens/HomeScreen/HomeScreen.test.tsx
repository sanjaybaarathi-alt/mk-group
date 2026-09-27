// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { axe } from 'jest-axe';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen.tsx';

vi.mock('./useHomeMotion.ts', () => ({ useHomeMotion: () => undefined }));
vi.mock('./ScrollConstructionHero.tsx', () => ({ ScrollConstructionHero: ({ onEnquire }: { onEnquire: () => void }) => <section id="hero"><h1>Every landmark begins with a foundation.</h1><button onClick={onEnquire}>Plan a project</button></section> }));
beforeAll(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('IntersectionObserver', class { observe(){} disconnect(){} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('MK Group home screen', () => {
  it('renders the architectural story and core disciplines', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every landmark begins');
    expect(screen.getByRole('heading', { name: /Structures shaped/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Rooms with rhythm/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Slim profiles/i })).toBeInTheDocument();
  });
  it('opens a correctly priced WhatsApp enquiry', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    const form = document.getElementById('project-form') as HTMLFormElement;
    fireEvent.change(screen.getByRole('textbox', { name: /FULL NAME/i }), { target: { value: 'Sanjay' } });
    fireEvent.change(screen.getByRole('textbox', { name: /PHONE NUMBER/i }), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByRole('textbox', { name: /SITE LOCATION/i }), { target: { value: 'Trichy' } });
    fireEvent.submit(form);
    const url = new URL(open.mock.calls[0][0]!);
    expect(url.origin + url.pathname).toBe('https://wa.me/919344237897');
    expect(url.searchParams.get('text')).toContain('Name: Sanjay');
    expect(url.searchParams.get('text')).not.toContain('separate quotation requested');
  });
  it('shows actionable inline errors for invalid contact details', () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    fireEvent.change(screen.getByRole('textbox', { name: /FULL NAME/i }), { target: { value: 'S' } });
    fireEvent.blur(screen.getByRole('textbox', { name: /FULL NAME/i }));
    expect(screen.getByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /FULL NAME/i })).toHaveAttribute('aria-invalid', 'true');
  });
  it('has no automated accessibility violations in the enquiry dialog', async () => {
    const { container } = render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    expect((await axe(container)).violations).toEqual([]);
  });
  it('prices selected services with approved rates', () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    const total = screen.getByLabelText('Indicative total');
    expect(total).toHaveTextContent('10,00,000');
    fireEvent.change(screen.getByRole('combobox', { name: 'CONSTRUCTION PACKAGE' }), { target: { value: 'luxury' } });
    expect(total).toHaveTextContent('15,00,000');
    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Constructions' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Precision Windows' }));
    expect(total).toHaveTextContent('1,95,000');
  });
  it('supports full keyboard comparison control', () => {
    render(<HomeScreen />);
    const slider = screen.getByRole('slider', { name: 'Before and after comparison' });
    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider).toHaveAttribute('aria-valuenow', '95');
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });
  it('keeps in-page links and images usable', () => {
    const { container } = render(<HomeScreen />);
    const broken = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter(link => !container.querySelector(link.getAttribute('href')!));
    expect(broken).toHaveLength(0);
    expect([...container.querySelectorAll('img')].every(image => image.hasAttribute('alt'))).toBe(true);
  });
});
