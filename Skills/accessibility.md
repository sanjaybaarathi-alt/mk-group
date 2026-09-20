---
title: React Accessibility Development Guidelines
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/ui/**"
---

# Accessibility Development Guidelines

## Context & Aim

**Goal**: Ensure React applications are usable by everyone, including people with disabilities using assistive technologies.

**Standard**: WCAG 2.2 Level AA compliance (legal requirement in most jurisdictions)

**Impact**: 96% of websites fail accessibility tests. Following these guidelines prevents legal issues and reaches 15% more users.

## Guidelines

### Semantic HTML
- Use `<button>` for actions, `<a>` for navigation
- Form inputs must have `<label>` elements (use `useId()` for unique IDs)
- Maintain logical heading hierarchy: h1 → h2 → h3 (no skipping levels)
- Use landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`

### Keyboard Navigation
- All interactive elements must work with Tab, Enter, Space, Escape
- Focus indicators must be visible (3:1 contrast ratio minimum)
- Tab order must be logical
- Focus must be trapped in modals and return to trigger on close

### Color & Contrast
- Text contrast must be ≥ 4.5:1 (normal), ≥ 3:1 (large 18pt+)
- Information cannot be conveyed by color alone
- Error states must have text/icons, not just color

### Images & Media
- Meaningful images must have descriptive `alt` text
- Decorative images must use `alt=""`
- Complex images need longer descriptions

### Forms
- Labels must be associated with inputs
- Required fields must be indicated clearly
- Error messages must be specific and actionable
- Related inputs must be grouped with `<fieldset>` and `<legend>`

### Dynamic Content
- Loading states must be announced with `aria-live="polite"`
- Error messages must use `role="alert"` or `aria-live="assertive"`
- Content changes must be announced to screen readers

### Focus Management
- Modals must trap focus and return to trigger
- Dynamic content must preserve or manage focus appropriately
- Skip links must be provided for main content

### ARIA Usage
- Use semantic HTML first, ARIA only when necessary
- Use `aria-label` for buttons without visible text
- Use `aria-expanded` for collapsible content
- Use `aria-describedby` for additional context

### React-Specific
- Use `useId()` hook for form field associations
- Handle keyboard events in custom components
- Manage focus in useEffect hooks
- Announce state changes with live regions

### Testing Requirements
- Tab through entire component with keyboard only
- Test with screen reader (VoiceOver/NVDA)
- Automated tests with jest-axe must pass
- Color contrast must be verified with tools

## Patterns to Follow

- `<button>` elements for clickable actions
- `<a>` elements for navigation links
- `useId()` for unique form field IDs
- `aria-live` regions for dynamic content updates
- Focus management in modals and dynamic content
- Descriptive alt text for meaningful images
- Empty `alt=""` for decorative images
- Logical heading hierarchy (h1 → h2 → h3)
- Keyboard event handlers for custom interactive elements
- Color contrast ratios meeting WCAG standards
- Visible focus indicators
- Associated labels for all form inputs
- Specific error messages with actionable guidance

## Anti-Patterns to Avoid

- `<div onClick={...}>` instead of `<button>`
- Missing alt text or generic alt text like "image"
- Color-only error indicators
- Focus lost after dynamic content changes
- Unlabeled form inputs
- Missing keyboard event handlers
- Insufficient color contrast
- ARIA overuse when semantic HTML works
- Skipping heading levels (h1 → h3)
- Generic error messages like "Error occurred"
- Auto-playing media without controls
- Opening new windows without warning users