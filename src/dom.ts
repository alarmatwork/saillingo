type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | ((e: any) => void)>;

/** Tiny hyperscript helper: h('button', { class: 'x', onclick: fn }, 'label') */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs)
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
      else if (k === 'class') el.className = String(v);
      else if (k === 'html') el.innerHTML = String(v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c as Node | string);
  return el;
}
