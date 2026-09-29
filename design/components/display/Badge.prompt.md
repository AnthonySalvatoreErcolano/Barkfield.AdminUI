Non-interactive status label — subscription state, order state, payment state in tables and headers.

```jsx
<Badge tone="success" dot>Active</Badge>
<Badge tone="warning" dot>Paused</Badge>
<Badge tone="danger" variant="solid">Payment failed</Badge>
```

- Tones: success · warning · danger (terracotta) · info (teal) · neutral · brand (cream on teal ink).
- Soft is default; use `solid` only for rare, urgent states.
