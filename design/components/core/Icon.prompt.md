Outline icon from the bundled Lucide subset — use for every UI glyph (nav, buttons, table actions); never emoji.

```jsx
<Icon name="truck" size={18} />
<Icon name="triangle-alert" color="var(--status-warning-solid)" />
```

- 68 names are bundled (see `IconName` in Icon.d.ts; SVG sources in `assets/icons/`).
- Inherits `currentColor`; default stroke 1.75 matches the brand's line icons on business cards.
- Sizes: 14 (dense table/chip), 16 (buttons), 18 (default), 20 (nav).
