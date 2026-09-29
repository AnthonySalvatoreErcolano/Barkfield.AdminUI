Interactive pill — quick filters above tables, or descriptive tags on customers/pups/products.

```jsx
<Chip selected={f==='active'} onClick={() => setF('active')} count={412}>Active</Chip>
<Chip variant="tag" icon="dog" size="sm">Golden Retriever</Chip>
<Chip variant="tag" onRemove={() => {}}>Grain-free</Chip>
```

- Use Badge (not Chip) for read-only status.
