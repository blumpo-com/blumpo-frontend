---
name: figma-design-implementation
description: Implement UI from Figma using Figma MCP (get_design_context, get_screenshot, get_metadata). Use when the user asks to implement a design from Figma, "zaimplementuj z Figmy", or provides a Figma node/URL. Handles px rounding and image sources.
---

# Figma design implementation (MCP)

When the user asks to implement a design from Figma (e.g. by sharing a frame URL or node ID), use the **Figma MCP** tools to get the design and then implement it in code. Follow the rules below.

## 1. Fetching the design

- Use **Figma Desktop MCP**:
  - `get_design_context`: primary tool — use it with the provided `nodeId` (or from URL, e.g. `node-id=1-2` → `1:2`) to get reference code, screenshot, and metadata. Pass `clientFrameworks` and `clientLanguages` (e.g. `react`, `typescript`) and `artifactType` (e.g. `WEB_PAGE_OR_APP_SCREEN`, `COMPONENT_WITHIN_A_WEB_PAGE_OR_APP_SCREEN`) when relevant.
  - `get_screenshot`: if you need an extra visual reference.
  - `get_metadata`: for structure overview (node IDs, types, names) when needed.
  - `get_variable_defs`: if the design uses variables (colors, spacing) you want to align with.
- If the user gives a Figma URL, extract the node id from the query (e.g. `?node-id=123-456` → `123:456`).

## 2. Rounding numeric values (px and unitless)

**All** size-related values from Figma must be **whole numbers** and **divisible by 2**. No decimals (e.g. no `23.453px`, no `14.5px`).

- **Rule**: round each value to the **nearest integer divisible by 2** (round up or down). Examples:
  - `23.453` → `24`
  - `22.7` → `22` or `24` (nearest even: 24)
  - `14.5` → `14`
  - `11.2` → `12`
- **Apply to**: font sizes, widths, heights, padding, margin, border radius, gap, line-height (if you use it), top/right/bottom/left, max-width, min-height, etc. — any numeric layout or typography value that comes from Figma.
- In code use only rounded values: e.g. `24px`, `16px`, `12px`, not `23.453px` or `14.5px`.

## 3. Line-height

- **Do not** add or propagate `line-height` from Figma into the code (per project rules). Omit line-height unless the user explicitly asks for it.

## 4. Images in the design

- When the selected frame (or its children) contains **images** (bitmaps, picture fills, or exported image assets), **before** implementing:
  1. Identify which images are present (from design context/metadata/screenshot).
  2. **Ask the user** where to get the image source in the project, for example:
     - *"W tym frame’ie są zdjęcia [krótki opis]. Z jakiego katalogu w projekcie mam brać linki do tych obrazków (np. `public/assets/...` lub ścieżka do plików)?"*
     - Or in English: *"This frame includes images [brief description]. Which folder or path in the project should I use for these image sources (e.g. `public/assets/...`)?"*
  3. Do not guess paths or use placeholder image URLs unless the user confirms or provides a path. Use `next/image` and paths they specify (e.g. under `public/`).

## 5. Implementation

- Use the project stack: **React 19**, **Next.js App Router**, **TypeScript**, **Tailwind CSS v4**, path alias `@/*`.
- Prefer existing UI primitives from `components/ui` and patterns from `app/` and `lib/`.
- Keep styles in Tailwind classes; avoid inline px that are not rounded per section 2.
- Output clean, type-safe code; follow AGENTS.md (PascalCase components, 2 spaces, named exports).

## Summary checklist

- [ ] Get design via Figma MCP (`get_design_context` with correct `nodeId`).
- [ ] Round every size value to nearest integer divisible by 2; no decimals.
- [ ] Omit line-height from Figma.
- [ ] If the frame has images → ask user for project path/folder for image sources, then use it.
- [ ] Implement using React, Next.js, Tailwind, and project conventions.
