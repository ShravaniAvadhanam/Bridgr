# Bridgr

Bridgr is a release intelligence layer for non-technical founders and first PMs.

It turns versioned engineering activity into plain-English product impact: what changed, who is affected, what needs action, and whether the current product focus is still on track.

## Why This Exists

Early-stage teams ship through GitHub, Linear, Slack, release notes, and ad hoc messages. The developer understands what changed, but the founder or PM often has to translate scattered technical updates into customer-facing decisions.

The core problem:

> A non-technical founder needs to know what changed in the product, who it affects, and what they need to do about it, right now, automatically, in plain English.

Bridgr is built for the reader, not the sender. Developers should not have to write status updates. PMs should not have to read commits, PRs, or deployment logs to understand customer impact.

## Who It Is For

### Primary User
Non-technical founders, CEOs, and first PMs at 2-15 person startups.

They own roadmap calls, investor updates, customer escalations, launch decisions, and support coordination, but they do not live inside GitHub.

### Secondary User
The developer, technical co-founder, or small engineering team.

They already ship through GitHub and may use Linear or Jira. They want their work to be visible without extra meetings, status pings, or manually written summaries.

## Demo Context

This prototype uses an ABM startup context: account intelligence, Salesforce and HubSpot imports, enrichment jobs, sales workflow tooling, staged rollouts, and customer-facing release risk.

## Research Summary

The product direction came from one repeated operating pattern in SaaS teams:

```text
(backend) v1.64 - fix for discount coupons not working
(android) v2.06 - fix for discount API failing, 10% rollout
```

Most SaaS companies already communicate product changes through patch notes, release notes, version history, Slack release channels, Play Store updates, and customer success updates. The missing layer is not more tracking. The missing layer is translation and prioritization.

### What We Learned

- GitHub is the source of engineering truth, but it is written for developers.
- Linear and Jira show work status, but still require technical fluency and manual hygiene.
- Slack is where updates happen, but context disappears quickly.
- Notion documents become stale as soon as releases move.
- Engineering analytics tools focus on engineering leaders, DORA metrics, cycle time, productivity, and resourcing. They do not serve the non-technical founder reading release impact.
- Digest tools summarize developer activity, but usually summarize technical content rather than business meaning.

### White Space

Most existing tools assume the reader understands engineering.

Bridgr is focused on the person across from engineering: the founder, PM, or operator who needs to decide what to tell customers, sales, support, and investors.

## Product Positioning

Bridgr is not a project management tool, issue tracker, engineering analytics dashboard, or developer monitoring product.

It is a shared release intelligence layer:

1. PM sets the product focus in plain language.
2. Bridgr reads versioned releases across connected repositories.
3. AI translates technical activity into customer and business impact.
4. Developer approves the translation.
5. PM sees the release feed, account impact, risk, and next action.

## Core Use Cases

### 1. Monday Morning Health Check
The PM opens Bridgr and answers one question in under five seconds:

> Are we okay, or do I need to act?

The Release Feed starts with a health signal before showing details.

**Examples:**
- **On track:** key releases are live and no customer action is needed.
- **Watch:** one important release is blocked or waiting for developer approval.
- **Blocked:** customer-facing work has stalled and needs a clear next step.

### 2. Versioned Release Intelligence
The PM can see release history across multiple repositories:
- API
- Web app
- Enrichment worker
- Integrations
- Chrome extension
- Mobile app

Each release is translated from technical notes into:
- What changed
- Who is affected
- Rollout state
- Customer/account scope
- Next action
- Risk if ignored
- Developer approval status

### 3. Customer and Support Readiness
Support and customer success need to know which customers are affected by which release version.

Bridgr includes an Accounts view that maps:
- Codebase
- Version
- Customer/account scope
- Rollout percentage
- What changed
- Status

This helps teams answer customer questions without opening GitHub.

### 4. Developer Translation Review
The translation loop is the product's differentiator.

AI drafts the plain-English summary, but the developer approves it before the PM uses it. This prevents translation drift and keeps trust high on both sides.

### 5. Lightweight PM Input
This is not a sprint planner. The PM only provides one operating input:

> What should releases prove this week?

That focus is then used to interpret release activity and surface action-needed states.

### 6. New Team Member Context
A new hire can open Bridgr and understand:
- What has shipped recently
- What is in progress
- Which releases affected customers
- What product priorities matter now
- Where action is needed

This turns release history into living product memory.

## Current Prototype Screens

### Onboarding
The onboarding flow collects:
- User role: Founder/PM or Developer
- GitHub connection intent
- Optional Linear connection
- Product/workspace name
- Weekly product focus
- Codebases to watch
- Release reviewer

### Release Feed
The primary MVP screen. It shows:
- Product health signal
- Current product focus
- Release counts
- Selected release detail
- Version history
- Rollout state
- Affected accounts
- Next action
- Risk if ignored
- PM decision action

### Dev Review
Shows summaries that need developer approval before PMs act on them.

### Accounts
Shows customer-facing release coverage by codebase, version, account scope, rollout, and one-line change summary.

### Action Needed
Shows the single release that needs action, why it matters, and what the PM or customer team should do next.

### Project Switcher
Allows teams to switch between products or workspaces with different connected repositories.

## What The MVP Deliberately Cuts
These were considered but removed from the demo scope:
- Weekly digest
- Full sprint or intent board
- Settings page
- Notifications
- Developer productivity metrics
- DORA metrics
- Broad project management workflows

The MVP stays focused on release intelligence.

## Functionality In This Repo

This is a Vite + React prototype.

**Implemented:**
- Three-step onboarding
- Project switching
- Multi-repository release feed
- PM focus input
- Release health signal
- Version history filters
- Release detail cards
- Developer review screen
- Accounts coverage table
- Action-needed view
- Deployment config for Vercel and Netlify

**Not implemented as real backend integrations yet:**
- GitHub OAuth
- Linear OAuth
- Live release ingestion
- AI translation API
- Developer approval persistence
- User accounts

The current data is realistic sample data for an ABM startup walkthrough.

## Design Direction

The interface is intentionally dark, restrained, and operational.

**Design principles:**
- Signal first, evidence second
- Plain language over technical jargon
- PM action over passive monitoring
- Shared truth, not developer surveillance
- Premium utility through hierarchy, borders, and restrained state color

**Visual references:**
- Linear: precise dark product UI
- Vercel dashboard: minimal operational signals
- Aurora-style prompt surfaces: dark, motion-rich, but controlled

**Avoided:**
- Warm white Notion-style softness
- Colorful gradients
- Decorative dashboards
- Generic SaaS hero copy
- Engineering analytics language

## Tech Stack
- React
- TypeScript
- Vite
- CSS
- lucide-react icons

## Local Setup

```bash
pnpm install
pnpm dev
```

If localhost is blocked in your environment, use the production build instead:
```bash
pnpm build
```
The built site is generated in `dist`.

## Build

```bash
pnpm build
```

Current production build output:
- `dist/index.html`
- `dist/assets/*.css`
- `dist/assets/*.js`

## Dependency Note

Dependencies are pinned in `package.json` so deploys do not accidentally install an incompatible Vite or Rolldown version.

If you see a native binding error such as `MODULE_NOT_FOUND` from rolldown, clear the stale install and rebuild:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## Deploy

### Vercel
This repo includes `vercel.json`.

Use:
- Framework preset: Vite
- Build command: `pnpm build`
- Output directory: `dist`

### Netlify
This repo includes `netlify.toml`.

Use:
- Build command: `pnpm build`
- Publish directory: `dist`

## GitHub Upload Notes

If pushing from a local machine:
```bash
git remote set-url origin https://github.com/ShravaniAvadhanam/Bridgr.git
git branch -M main
git push -u origin main
```

If starting from the zip file created during handoff:
```bash
unzip bridgr-github-ready-latest.zip -d Bridgr-upload
cd Bridgr-upload
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ShravaniAvadhanam/Bridgr.git
git branch -M main
git push -u origin main
```

## Product Status

Prototype ready for demo walkthrough and deployment.

The next product step is connecting real GitHub release data and adding the developer approval persistence layer.
