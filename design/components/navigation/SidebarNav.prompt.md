Primary navigation for the admin portal — fixed full-height left column.

```jsx
<SidebarNav logoSrc="assets/logos/logo.svg" productName="Autoship Admin" active={page} onSelect={setPage}
  sections={[{ items: [{id:'dash',label:'Dashboard',icon:'layout-dashboard'},{id:'subs',label:'Subscriptions',icon:'repeat',badge:3}] }]} />
```

- White column with a 1px warm border; active item is a teal-50 pill with teal text.
- Badge is for things needing attention (failed payments), not totals.
