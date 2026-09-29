# Autoship Admin — UI kit

Internal portal for Barkfield Road staff to manage autoship (recurring delivery) customers and the weekly delivery schedule.

**Not a recreation of an existing product** — no admin UI existed in the sources (brand book only). These screens are an original application of the brand to the brief; treat them as reference compositions.

## Screens (click-through in `index.html`)
- **Dashboard** — KPI StatCards, payment Alert, upcoming deliveries table, today's route (brand Card), bakery add-ons.
- **Subscriptions** — status filter Chips with counts, route/frequency Selects, selectable + sortable DataTable, bulk "Skip next", Pagination.
- **Customer detail** — Breadcrumbs, status Badge, Tabs (Overview / Orders), plan Card, upcoming boxes, cream pup Card, contact + Switch/Checkbox prefs, **Pause Dialog** → Toast.
- **Delivery schedule** — week grid by day, route-filter Chips, pill Tabs view toggle.

## Files
- `Shell.jsx` — `AdminShell` (light SidebarNav + top bar) and `PageHeader`
- `Dashboard.jsx`, `Subscriptions.jsx`, `CustomerDetail.jsx`, `Schedule.jsx`
- `data.js` — fake customers, orders, week schedule (`window.BR_DATA`)

All primitives come from the design-system bundle (`window.BarkfieldRoadDesignSystem_ed681c`).
