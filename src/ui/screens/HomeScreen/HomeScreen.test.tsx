// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen.tsx';

vi.mock('./useHomeMotion.ts', () => ({ useHomeMotion: () => undefined }));
beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() { return undefined; }
    disconnect() { return undefined; }
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('MK Group home screen', () => {
  it('renders the approved brand story and switches ecosystem stages', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('FROM FOUNDATION');
    expect(document.querySelector('.mk-hero__viewfinder')).toBeInTheDocument();
    expect(document.querySelector('.mk-hero-assembly')).not.toBeInTheDocument();
    expect(document.querySelector('.mk-discipline-band')).toBeInTheDocument();
    const firstImage = document.getElementById('eco-image')?.getAttribute('src');
    fireEvent.click(document.getElementById('eco-tab-1')!);
    expect(screen.getByText('MK Design Interriors: We Design.')).toBeInTheDocument();
    expect(document.getElementById('eco-image')?.getAttribute('src')).not.toBe(firstImage);
    const glazing = within(document.querySelector('.mk-journey__controls') as HTMLElement).getByRole('button', { name: /Glazing/i });
    fireEvent.click(glazing);
    expect(document.getElementById('eco-image')).toHaveAttribute('src', '/images/windows.webp');
    expect(glazing).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves the navigation underline to the selected division', () => {
    render(<HomeScreen />);
    const interiors = screen.getAllByRole('link', { name: 'Design Interriors' })[0];
    fireEvent.click(interiors);
    expect(interiors).toHaveClass('is-active');
    expect(screen.getAllByRole('link', { name: 'Constructions' })[0]).not.toHaveClass('is-active');
    const process = screen.getAllByRole('link', { name: 'Process' })[0];
    expect(process).toHaveAttribute('href', '#process');
    fireEvent.click(process);
    expect(process).toHaveClass('is-active');
    expect(document.getElementById('process')).toBeInTheDocument();
  });

  it('opens a prefilled WhatsApp enquiry that the visitor sends manually', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    expect(screen.getByRole('dialog', { name: 'Architectural consultation' })).toBeInTheDocument();
    const form = document.getElementById('project-form') as HTMLFormElement;
    fireEvent.change(screen.getByRole('textbox', { name: /FULL NAME/i }), { target: { value: 'Sanjay' } });
    fireEvent.change(screen.getByRole('textbox', { name: /EMAIL ADDRESS/i }), { target: { value: 'sanjay@example.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /PHONE NUMBER/i }), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByRole('textbox', { name: /SITE LOCATION/i }), { target: { value: 'Trichy' } });
    fireEvent.submit(form);
    expect(open).toHaveBeenCalledOnce();
    const url = new URL(open.mock.calls[0][0]!);
    expect(url.origin + url.pathname).toBe('https://wa.me/919344237897');
    expect(url.searchParams.get('text')).toContain('Name: Sanjay');
    expect(url.searchParams.get('text')).toContain('Service: MK Constructions');
    expect(url.searchParams.get('text')).toContain('Location: Trichy');
    expect(url.searchParams.get('text')).toContain('500 sq ft built-up area');
    expect(screen.getByText(/Review it and press Send there/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'open it here' })).toHaveAttribute('href', open.mock.calls[0][0]);
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(document.getElementById('consultation-modal')).toHaveAttribute('aria-hidden', 'true');
  });

  it('defaults the enquiry service to the selected ecosystem stage', () => {
    render(<HomeScreen />);
    fireEvent.click(document.getElementById('eco-tab-2')!);
    fireEvent.click(screen.getByRole('button', { name: /Consult Civil Team/i }));
    expect(screen.getByRole('checkbox', { name: 'MK Precision Windows' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'MK Constructions' })).not.toBeChecked();
  });

  it('prices construction and windows independently and combines selected services', () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    const total = screen.getByLabelText('Indicative total');
    expect(screen.getByRole('slider', { name: 'BUILT-UP SQUARE FEET' })).toHaveAttribute('min', '500');
    expect(total).toHaveTextContent('₹12,50,000');

    fireEvent.change(screen.getByRole('combobox', { name: 'CONSTRUCTION FINISH' }), { target: { value: 'premium' } });
    expect(total).toHaveTextContent('₹10,00,000');
    fireEvent.change(screen.getByRole('combobox', { name: 'CONSTRUCTION FINISH' }), { target: { value: 'standard' } });
    expect(total).toHaveTextContent('₹9,50,000');
    fireEvent.change(screen.getByRole('slider', { name: 'BUILT-UP SQUARE FEET' }), { target: { value: '1000' } });
    expect(total).toHaveTextContent('₹19,00,000');

    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Constructions' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Precision Windows' }));
    expect(total).toHaveTextContent('₹4,50,000');
    fireEvent.change(screen.getByRole('combobox', { name: 'WINDOW SYSTEM' }), { target: { value: 'acoustic' } });
    expect(total).toHaveTextContent('₹6,00,000');
    fireEvent.change(screen.getByRole('combobox', { name: 'WINDOW SYSTEM' }), { target: { value: 'slimline' } });
    expect(total).toHaveTextContent('₹7,50,000');
    fireEvent.change(screen.getByRole('slider', { name: 'WINDOW / GLAZING SQUARE FEET' }), { target: { value: '1000' } });
    expect(total).toHaveTextContent('₹15,00,000');
    fireEvent.change(screen.getByRole('combobox', { name: 'WINDOW SYSTEM' }), { target: { value: 'acoustic' } });
    fireEvent.change(screen.getByRole('slider', { name: 'WINDOW / GLAZING SQUARE FEET' }), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Constructions' }));
    expect(total).toHaveTextContent('₹25,00,000');
    fireEvent.click(screen.getByRole('checkbox', { name: 'MK Design Interriors' }));
    expect(screen.getByText(/quoted separately after a design brief/i)).toBeInTheDocument();
  });

  it('supports keyboard comparison control', () => {
    render(<HomeScreen />);
    const slider = screen.getByRole('slider', { name: 'Before and after comparison' });
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    expect(document.getElementById('comparison-container')?.style.getPropertyValue('--compare')).toBe('55%');
  });

  it('shows the scroll-led sliding window without the former manual controls', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 2, name: 'MK Precision Windows' })).toBeInTheDocument();
    expect(document.querySelector('.mk-window__fixed')).toBeInTheDocument();
    expect(document.querySelector('.mk-window__moving')).toBeInTheDocument();
    expect(document.getElementById('window-slider')).not.toBeInTheDocument();
  });

  it('keeps in-page links and content images usable', () => {
    const { container } = render(<HomeScreen />);
    const brokenLinks = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
      .filter((link) => !link.getAttribute('href')!.startsWith('#/') && !container.querySelector(link.getAttribute('href')!));
    expect(brokenLinks).toHaveLength(0);
    expect([...container.querySelectorAll('img')].every((image) => image.hasAttribute('alt'))).toBe(true);
    expect([...container.querySelectorAll('img')].every((image) => image.getAttribute('src')?.startsWith('/'))).toBe(true);
    expect(container.querySelector('#hero img')).toHaveAttribute('src', '/images/villa-hero.webp');
  });
});
