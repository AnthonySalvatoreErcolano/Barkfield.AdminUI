Binary opt-in or multi-select — row selection, notification preferences.

```jsx
<Checkbox label="Send reminder 2 days before delivery" checked={on} onChange={setOn} />
<Checkbox indeterminate aria-label="Select all" />
```

- 18px box, 2px radius, teal fill with cream check. `onChange(checked)` — boolean first.
