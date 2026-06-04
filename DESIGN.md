# Design

## Overview

Bridgr is a dark product UI for release intelligence. The design system is editorial and restrained: dense enough for operational work, precise enough for founder trust, and quiet enough that release meaning stays primary.

## Color

Use the existing CSS variables as canonical tokens.

```css
--bg-base: #0a0a0a;
--bg-surface: #111111;
--bg-hover: #1a1a1a;
--bg-active: #222222;
--border: #242424;
--border-subtle: #1a1a1a;
--text-primary: #f0f0f0;
--text-secondary: #888888;
--text-muted: #444444;
--green: #22c55e;
--green-bg: #052e16;
--amber: #f59e0b;
--amber-bg: #1c1000;
--red: #ef4444;
--red-bg: #1c0000;
--blue: #60a5fa;
--blue-bg: #0d1b2e;
--white: #ffffff;
```

### Usage

- `bg-base` is the page canvas.
- `bg-surface` is for cards, tables, panels, and role cards.
- `bg-hover` is for active navigation, hover rows, and selected segmented controls.
- `border` defines primary separation.
- `border-subtle` defines dividers inside panels.
- Semantic colors are reserved for release state only: green live, amber watch/review, red blocked, blue ready/info.
- Prefer semantic color as border, pill, dot, or inline text. Full colored surfaces are reserved for high-attention review and action-needed states only.
- Avoid decorative gradients. Glow effects are permitted only on high-attention cards and must use restrained blue/green/white or status color.

## Typography

Font: Inter throughout.

- Display: 2rem / 700 / -0.5px for onboarding hero copy.
- H1: 1.375rem / 600 / -0.018em for page titles.
- H2: 1.125rem / 600 / -0.012em for cards and section titles.
- H3: 0.9375rem / 600 / -0.006em for compact headings and release row titles.
- Body: 0.875rem / 400 / 1.6-1.65 for translated release meaning.
- Small: 0.8125rem / 400-600 for metadata, buttons, and raw release notes.
- Label: 0.6875rem / 500 / 0.08em uppercase.
- Micro/status: 0.625rem / 500 / 0.1em uppercase.

Do not use display fonts in product UI labels, table rows, buttons, or data surfaces.
Use tabular numerals for metrics, versions, rollout percentages, and account tables.
Keep release-detail prose to 65-75 characters where possible.

## Layout

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px. Use CSS tokens `--space-1` through `--space-12`.
- Product shell: fixed left sidebar at 220px on desktop, collapses to top nav on tablet/mobile.
- Main work area: 32px desktop padding, 18-24px mobile padding.
- Primary release layout: selected release detail plus fixed 320-360px version-history rail on desktop. Stack below 980px.
- Version-history rail is sticky on desktop so release selection stays reachable while reading detail.
- Project switcher lives in the sidebar, above navigation. It must show current workspace and number of connected codebases.
- The Release Feed begins with one health signal. It contains status, release counts, the current product focus, and a compact focus input.
- Do not add separate dashboard stat cards above the feed unless they change what the PM should do next.
- Cards use 10px radius, 1px border, no shadows.
- Buttons and inputs use 7px radius.
- Tags use 5px radius.
- Accounts table keeps six desktop columns. Below tablet width, rows become labeled stacked records.

## Components

### Sidebar

Background `#0d0d0d`, border-right `#1a1a1a`. Active item: `#1a1a1a` background, white text, 2px white left border. Inactive: secondary text, no background.

### Project Switcher

Compact sidebar control for switching between products with different connected repositories. It scopes the release feed and action-needed view to watched codebases. Include a restrained "New project" action. Do not turn this into a workspace settings page in the demo.

### Onboarding

Onboarding must activate the first feed. Step 3 collects product name, product focus, codebases to watch, and release reviewer. Avoid tutorial copy. The first value is seeing a release feed that already reflects the PM's current product priority.

### PM Focus Input

A single textarea that answers: "What should releases prove this week?" The saved focus is used by the health signal and action-needed view. This is the PM's primary input loop.

### PM Decision

The release detail ends with a compact decision row. It lets the PM mark whether customer action is planned for the selected release. This keeps the platform from becoming passive monitoring.

### Delight Moments

Delight is limited to task confirmation: saving focus, switching projects, and planning customer action. Use restrained state shifts, check confirmation, and short inline feedback. No celebration effects.

### Quiet Treatment

Default dashboard surfaces stay neutral. Release rows should not use persistent colored fills; state is shown through labels, borders, dots, and selected-row accents. Glow effects are hover-sensitive and low intensity, never an automatic page-load event.

### Bold Treatment

Boldness comes from hierarchy, not decoration. The health signal, selected release title, and metric numerals may use larger type and stronger spacing. Do not add gradients, neon color, or more persistent colored surfaces to make the UI feel stronger.

### Health Signal

Single compact panel at the top of Release Feed. It should answer "are we okay or do I need to act?" before showing the release list.

- Line 1: status + release counts + active project.
- Line 2: precise reason + action link.
- Line 3: compact counts and PM focus input, only if they support the next decision.

Use semantic dot plus written status. Do not expand into a multi-card dashboard, role switcher, or separate stats strip.

### Release Detail

The selected release is the primary reading surface. It must include:

- Status
- Codebase, version, channel
- Rollout and affected account scope
- What changed
- Affected accounts
- Next action
- Engineer note
- Risk if ignored
- Developer approval
- PM decision

### Accounts Table

Each row must show codebase, version, account scope, rollout, and one-line change summary. This is designed for support/customer success scanning.

### Review Cards

Developer review cards show the engineer note, plain-English summary, and approval action. PM view should communicate waiting state, not demand action.

## Motion

Use the existing timing tokens:

```css
--duration-fast: 150ms;
--duration-default: 200ms;
--duration-gentle: 250ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-page: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

Motion should convey state, focus, or entrance only. Keep product transitions between 150-250ms. Respect `prefers-reduced-motion`.

## Performance

Decorative pointer effects must be throttled with `requestAnimationFrame`, respect reduced motion, and avoid repeated layout reads during pointer movement. Do not add persistent `will-change` to large decorative grids.

## Copy

Copy must be plain, specific, and operational. Prefer "HubSpot sync is blocked for large lists" over abstract status language. No jargon reaches the PM unless translated in the same view.
