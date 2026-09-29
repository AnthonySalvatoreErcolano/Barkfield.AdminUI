# Barkfield Road Design System

Barkfield Road is a local, quality-first dog food & supply shop (with an in-store dog bakery, **Barkfield Bakery**) in East Northport, Long Island, NY. Positioning: *"At Barkfield Road, you can fur-get about making ruff decisions. Our quality products are vetted ahead of time by our caring and highly trained staff so you can rest easy knowing your dog is in good hands."* Tagline: **"Where quality and wellness intersect."**

This system is geared toward an internal **Autoship Admin portal** — staff tools for managing recurring-delivery customers, subscriptions and the weekly delivery schedule — plus the brand foundations needed for any other surface.

## Sources
- `uploads/BarkfieldRoad_BrandBook_002.pdf` — Brand Book dated 09.21.2022 (36 pp): story, brand lens (The Advocate), word bank, mission/vision, personas, typography, logos, colors, color proportions, service mockups.
- No codebase, Figma, or existing product UI was provided. **All admin UI components and screens are original applications of the brand**, not recreations.
- `uploads/barkfield_horizonal_logo_full_color_rgb.svg` — primary logo (horizontal, full color), supplied separately. Copied to `assets/logos/logo.svg` with embedded C2PA metadata stripped.
- Brand-in-action mockups from the PDF were rendered to JPG.

## Index
- `styles.css` — entry point (imports only) → `tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`
- `fonts/` — Montserrat (temporary placeholder for Brother 1816) + Zilla Slab woff2
- `assets/logos/logo.svg` — the primary logo; the only mark used in product UI
- `assets/icons/` — Lucide SVG subset (68 icons); same set bundled in `components/core/iconData.js`
- `assets/imagery/` — brand-in-action mockups (business cards, bakery, storefront, packaging, apparel, hats)
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand)
- `components/` — React primitives (see below), one `@dsCard` per folder
- `ui_kits/component-gallery/` — **every component and state on one page** (the main reference to hand to Claude Code)
- `ui_kits/autoship-admin/` — click-through admin portal (Dashboard, Subscriptions, Customer detail + Pause dialog, Delivery schedule)
- `SKILL.md` — agent-skill entry point
- `thumbnail.html` — homepage tile

## Components
- **core/** — `Button`, `IconButton`, `Icon`
- **forms/** — `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`
- **display/** — `Badge`, `Chip`, `Card`, `StatCard`
- **data/** — `DataTable`, `Pagination`
- **navigation/** — `SidebarNav`, `Tabs`, `Breadcrumbs`
- **feedback/** — `Alert`, `Toast`, `Tooltip`
- **overlays/** — `Dialog`, `DropdownMenu`

Each has `Name.jsx` + `Name.d.ts` (props) + `Name.prompt.md` (usage). Styling is class-based CSS injected once per component (`components/core/useStyles.js`) and driven entirely by the tokens.

**Intentional additions** (no source defined components, so a standard admin set was authored): `Icon` wraps the bundled Lucide subset; `StatCard`, `DataTable`, `Pagination`, `SidebarNav`, `Breadcrumbs`, `Alert`, `DropdownMenu`, `Textarea` exist because the autoship-admin brief requires dashboards, tables and app navigation. `ICONS` (raw icon map) is also exported.

---

## CONTENT FUNDAMENTALS

**Voice.** Brand lens is *The Advocate* — "compassion in action". Knowledgeable, passionate, authentic, playful, caring, calm, reassuring, **non-judgmental**, patient, approachable. Speaks "from one pet parent to another".

**Person.** Second person to the customer ("so **you** can rest easy knowing **your** dog is in good hands"), first-person plural for the company ("**we** make the ruff decisions for you"). In the admin portal, speak to staff plainly in second person; refer to customers by first name and pups by name ("Biscuit's box moves to Oct 30").

**No puns in the staff portal.** The brand's dog puns (*pawsitive, fur-ever, ruff decisions…*) belong to customer marketing only. Admin copy is plain, calm and specific.

**Words to use:** quality, high-quality, wellness, health & wellness, live life to the fullest, pups, babies, furry / fur-ever / four-legged friend, precious pal, wholesome / quality ingredients, grassfed, organic, wild-caught, free-range, human-grade, made in USA, simple, enjoyable, memorable, community, family, welcome home.
**Words not to use:** doggy, kitty, doggies & kitties, hate, sucks, "just a dog".

**Casing.** Display titles, buttons, labels, badges and table headers are set in ALL CAPS by CSS (`text-transform`) — author them in **sentence case** in source ("Pause autoship", "Next delivery"). Body copy is sentence case. The brand book writes emphasis as caps in prose ("the very BEST") — avoid that in UI.

**Emoji.** Not part of the brand system (the Instagram bio uses a few; that's social-only). Never in UI — use Lucide icons.

**Examples (admin):**
- Success toast: "Next delivery skipped — Biscuit's box moves to Oct 30." with *Undo*.
- Error alert: "Card declined. Visa ending 4242 was declined on Sep 26. Next delivery is on hold until payment is updated."
- Dialog: title "Pause Biscuit's autoship?", body states exactly what happens and who is notified; buttons "Keep active" / "Pause autoship".
- Empty state: "No stops on selected routes."

## VISUAL FOUNDATIONS

**Color.** Four brand colors — Teal `#007167` (PMS 328 C), Terracotta `#C76C61` (7607 C), Tan `#C09473` (4655 C), Cream `#F2DAB2` (7506 C). The color-proportions page shows **teal dominant, cream as the field, terracotta and tan as accents**. Extended 50–900 scales and warm "ink" neutrals (teal-black) are derived for UI. Status: success = derived green, warning = derived amber, **danger = terracotta**, info = teal. In the admin, the working field is warm white (`--bg-app #FAF5EC`) with white cards and a **white sidebar**; teal is reserved for primary actions, headings, active states and at most one brand card per screen; cream is for panels and highlights.

**Type.** Titles: **Brother 1816 Black / Bold** (currently rendered with **Montserrat** as a temporary placeholder), all caps, tracking **+10 (0.01em)** — the book explicitly shows too-tight and too-loose as don'ts. Body: **Zilla Slab Regular**. UI labels/buttons/table heads use the display face in caps with slightly wider tracking (0.06em) for legibility at 11–13px. Page titles are teal Black caps; data and prose are Zilla Slab with tabular figures.

**Backgrounds.** Flat, solid color fields only — cream or teal. No gradients, no photography behind UI, no textures in the app. The logos themselves carry a subtle distressed/printed texture; the kraft-paper bakery packaging uses a repeating stamped logo pattern — reserve patterns for packaging/marketing, not the admin.

**Motifs.** (1) A **tan vertical stripe** runs down the left edge of every brand-book page (print motif — not used in the admin). (2) **Circles**: the round badge logo and the color-proportion circles → pills for badges/chips, circular icon discs, round date markers. (3) **Split cream/teal panels** (every logo page) → cream Card tone next to teal brand Card.

**Illustration.** Vintage hand-inked engraving style (retriever head, jumping dog, chef-hat dog) in two-color print. Use supplied PNGs only; never draw new illustrations.

**Imagery.** Warm, flat-lit product mockups on solid teal, cream or terracotta backgrounds; storefront photography is natural daylight. No cool tones, no heavy grain, no B&W.

**Corner radii.** Tight: 2px (checkbox), **4px** (buttons, inputs), **6px** (cards, alerts), 10px (dialogs); 999px pills for badges/chips; 50% for circles.

**Cards.** White, **1px warm border** (`--border-default #E4D9C6`), 6px radius, hairline shadow (`--shadow-xs`). Titles are uppercase display 16px. No colored left-border accents. Tones: `cream` (brand panel) and `brand` (teal, cream text) — at most one teal card per screen.

**Borders & shadows.** Borders do the separating work; shadows are warm (brown-tinted rgba) and low. Elevation ladder: xs (resting cards) → sm (switch thumb, pill tab) → md (tooltips) → lg (dialogs, toasts). No inner shadows.

**Hover / press / focus.** Hover: surfaces warm slightly (`--surface-hover`), teal actions darken one step (500→600), outlines pick up teal-300. Press: one more step darker + 1px downward nudge. Focus: 3px soft teal ring (`--focus-ring`). Disabled: 45% opacity.

**Motion.** Quiet and quick: 120ms (hover), 180ms (toggles), 260ms (dialogs/toasts) on `cubic-bezier(.2,.7,.2,1)`. Fades + 8–10px rises only; no bounce, no spring.

**Transparency & blur.** Only the modal scrim (ink at 48%) and faint cream overlays on teal for nav hover. No backdrop blur.

**Layout.** Fixed 248px white sidebar (1px warm border), 64px white top bar, content max 1320px with 32px gutters, 16px grid gaps. 4-up StatCard row, then 2:1 content splits. Tables live inside flush Cards.

## ICONOGRAPHY

- The brand book shows only simple **outline line icons** (phone, email, map pin, globe on the business cards) — no icon font or SVG set was supplied.
- **Substitution:** [Lucide](https://lucide.dev) (ISC) outline icons at **1.75 stroke, round caps/joins**, the closest CDN-available match. 68 icons were copied programmatically to `assets/icons/*.svg` and bundled in `components/core/iconData.js`; use via `<Icon name="truck" />`.
- Sizes: 14 (dense), 16 (buttons), 18 (default), 19–20 (nav). Color = `currentColor`; teal on light, cream on teal.
- **No emoji. No unicode glyphs as icons** (✓/✕ appear only in the tracking specimen card to mirror the brand book).

## Logo usage
- Use **`assets/logos/logo.svg`** (horizontal, full color: teal wordmark over tan dog) — it's the only mark needed for product UI.
- Place on white or cream. Sidebar width 176px; minimum ~120px wide.
- Don't recolor, outline, or place on teal/busy imagery.

## Fonts — substitution flag
**Brother 1816** (titles) is a commercial typeface not yet supplied. `--font-display` currently uses **Montserrat** (bundled locally, `fonts/Montserrat-Variable.woff2`) as a **temporary placeholder**. To swap: add Brother 1816 woff2 files to `fonts/`, add `@font-face` rules in `tokens/fonts.css`, and set `--font-display:"Brother 1816",…` in `tokens/typography.css`. Zilla Slab is the real brand body face.
