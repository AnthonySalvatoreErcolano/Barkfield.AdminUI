One-of-many choice where all options should be visible (≤5) — e.g. delivery window, skip vs pause.

```jsx
{['Skip next delivery','Pause for 1 month','Pause indefinitely'].map(o =>
  <Radio key={o} name="hold" value={o} label={o} checked={hold===o} onChange={setHold} />)}
```
