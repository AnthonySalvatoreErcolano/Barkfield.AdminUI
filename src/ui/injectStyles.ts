// Injects a component's stylesheet once per document, as the design system does
// (design/components/core/useStyles.js). Keeps each component self-contained, with no CSS tooling.
const done = new Set<string>();

export function injectStyles(id: string, css: string) {
  if (typeof document === 'undefined' || done.has(id)) return;
  if (!document.getElementById('br-css-' + id)) {
    const el = document.createElement('style');
    el.id = 'br-css-' + id;
    el.textContent = css;
    document.head.appendChild(el);
  }
  done.add(id);
}

/** Join class names, skipping falsy ones. */
export function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}
