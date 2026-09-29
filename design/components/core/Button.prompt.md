Standard action button — one primary per view; use for form submits, dialog confirms, toolbar actions.

```jsx
<Button variant="primary" iconLeft="plus">New subscription</Button>
<Button variant="secondary" size="sm" iconLeft="download">Export</Button>
<Button variant="danger">Cancel autoship</Button>
```

- Variants: `primary` (teal), `accent` (terracotta — sparing, for "create/new"), `secondary` (outline), `ghost`, `danger`, `cream` (on teal backgrounds).
- Sizes: sm 30px · md 38px · lg 46px. Labels are uppercase automatically — write them in sentence case.
- Press state nudges 1px down; focus shows teal ring.
