Modal for pause/skip/cancel confirmations and short edit forms. Click scrim or × to close.

```jsx
<Dialog open={open} onClose={close} title="Pause autoship?" description="Biscuit's deliveries will stop until you resume."
  footer={<><Button variant="ghost" onClick={close}>Keep active</Button><Button onClick={pause}>Pause autoship</Button></>}>
  <Radio … />
</Dialog>
```

- Destructive confirms: primary button becomes `variant="danger"` or `accent`; say exactly what happens.
