Dropdown for picking one option from a short fixed list.

```jsx
<Select label="Delivery every" value={freq} onChange={e => setFreq(e.target.value)}
  options={[{value:'2',label:'2 weeks'},{value:'4',label:'4 weeks'},{value:'6',label:'6 weeks'}]} />
```

- Accepts strings or `{value,label,disabled}` options. Teal chevron.
