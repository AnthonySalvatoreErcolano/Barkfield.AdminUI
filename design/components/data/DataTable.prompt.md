The workhorse list view — customers, subscriptions, deliveries, orders. Put inside `<Card flush>`.

```jsx
<DataTable
  columns={[
    { key: 'name', header: 'Customer', sortable: true, render: r => <strong>{r.name}</strong> },
    { key: 'status', header: 'Status', render: r => <Badge tone="success" dot>{r.status}</Badge> },
    { key: 'total', header: 'Total', align: 'right' },
  ]}
  rows={rows} selectable selected={sel} onSelectChange={setSel}
  sort={sort} onSortChange={setSort} onRowClick={openCustomer}
/>
```

- Right-align currency and counts; numbers are tabular.
- Status → Badge, attributes → Chip variant="tag", row actions → IconButton size="sm".
