// Injects a component's stylesheet once per document. Keeps components self-contained (no CSS-in-JS deps).
const done = {};
export function injectStyles(id, css) {
  if (typeof document === 'undefined' || done[id] || document.getElementById('br-css-' + id)) { done[id] = true; return; }
  const el = document.createElement('style');
  el.id = 'br-css-' + id;
  el.textContent = css;
  document.head.appendChild(el);
  done[id] = true;
}
