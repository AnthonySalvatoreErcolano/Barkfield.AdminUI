Brief feedback after an action — "Delivery skipped", "Subscription paused". Auto-dismiss ~5s; offer Undo when reversible.

```jsx
<div className="br-toast-stack">
  <Toast tone="success" title="Next delivery skipped" message="Biscuit's box moves to Oct 24." actionLabel="Undo" onAction={undo} onClose={close} />
</div>
```
