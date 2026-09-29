Switch between sibling views of one object (customer: Overview / Orders / Pups / Notes) or toggle a view mode.

```jsx
<Tabs value={tab} onChange={setTab} tabs={[{id:'overview',label:'Overview'},{id:'orders',label:'Orders',count:14}]} />
<Tabs variant="pill" value={view} onChange={setView} tabs={[{id:'week',label:'Week'},{id:'list',label:'List'}]} />
```
