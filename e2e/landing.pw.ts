import { test, expect } from '@playwright/test';

test('construction runs forward and backward, pauses and skips to services', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#hero')).toHaveClass(/mk-build--live/, { timeout: 15000 });
  const scroll = async (progress: number) => {
    await page.evaluate(p => {
      const hero = document.querySelector<HTMLElement>('#hero')!;
      window.scrollTo({ top: hero.offsetTop + (hero.offsetHeight - innerHeight) * p, behavior: 'instant' });
    }, progress);
  };
  for (const [p, label] of [[.2, 'Ground floor'], [.4, 'Upper floor'], [.6, 'Walls & roof'], [.8, 'Windows & finishes'], [1, 'Complete'], [.2, 'Ground floor'], [0, 'Foundation']] as const) {
    await scroll(p);
    await expect(page.locator('.mk-build__chapter > span')).toContainText(label);
  }
  const state = await page.locator('#hero').getAttribute('style');
  await page.waitForTimeout(250);
  expect(await page.locator('#hero').getAttribute('style')).toBe(state);
  await page.locator('.mk-build__skip').click();
  await expect.poll(() => page.locator('#services').evaluate(el => Math.abs(el.getBoundingClientRect().top - 88))).toBeLessThan(5);
  await page.screenshot({ path: 'artifacts/services-verified.png' });
  await page.getByRole('button', { name: 'Enquire', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile layout, keyboard slider and reduced motion remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#hero')).toHaveClass(/mk-build--live/, { timeout: 15000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#constructions-section').scrollIntoViewIfNeeded();
  await expect(page.locator('#constructions-section')).toHaveClass(/is-mobile-visible/);
  await page.locator('#window-experience').scrollIntoViewIfNeeded();
  expect(await page.locator('#window-experience').evaluate(el => el.parentElement?.classList.contains('pin-spacer'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#hero')).toHaveClass(/mk-build--static/);
  const slider = page.getByRole('slider', { name: 'Before and after comparison' });
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow', '95');
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '5');
  await page.screenshot({path:'artifacts/comparison-mobile-verified.png'});
});

test('unsupported WebGL has a usable static fallback without a long empty scroll', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (id: string, ...args: unknown[]) {
      if (id.startsWith('webgl')) return null;
      return original.call(this, id as '2d', ...args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('#hero')).toHaveClass(/mk-build--static/);
  await expect(page.locator('.mk-build__poster')).toBeVisible();
  const height = await page.locator('#hero').evaluate(el => el.getBoundingClientRect().height);
  expect(height).toBeLessThanOrEqual(1100);
});

test('enquiry reports field errors beside invalid inputs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enquire', exact: true }).click();
  await page.getByRole('textbox', { name: /FULL NAME/i }).fill('S');
  await page.getByRole('button', { name: /Send inquiry on WhatsApp/i }).click();
  await expect(page.getByText('Enter your full name.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /FULL NAME/i })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toContainText('highlighted contact details');
});

test('concept routes set metadata, focus the heading and offer a conversion path', async ({ page }) => {
  await page.goto('/projects/monolith-villa');
  await expect(page).toHaveTitle(/Monolith Villa.*Concept Portfolio/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('link', { name: /Discuss this concept/i })).toHaveAttribute('href', /wa\.me\/919344237897/);
  await expect(page.getByText('Concept study')).toBeVisible();
});
