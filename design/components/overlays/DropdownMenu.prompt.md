Action menu for row "more" buttons, bulk actions, and sort/view pickers. Use Select for form values.

```jsx
<DropdownMenu align="right" trigger={<IconButton icon="ellipsis" label="Actions" size="sm" />} items={[
  { label: 'Edit plan', icon: 'pencil' },
  { label: 'Skip next delivery', icon: 'skip-forward' },
  { divider: true },
  { label: 'Cancel autoship', icon: 'trash-2', danger: true },
]} />
```

- `selected` shows a check (single-choice lists); `heading` adds a group label.
