type Child = HTMLElement | string | (() => string | HTMLElement);

/*
 * Create a DOM element
 */
export function h(tag: string, props: any = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);

  for (const key in props) {
    if (key.startsWith('on') && typeof props[key] === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else if (key === 'style' && typeof props[key] === 'object') {
      Object.assign(el.style, props[key]);
    } else if (key.startsWith('data-') || key.startsWith('aria-')) {
      el.setAttribute(key, props[key]);
    } else {
      (el as any)[key] = props[key];
    }
  }

  children.forEach((child) => {
    if (typeof child === 'function') {
      const render = child();
      if (render instanceof HTMLElement) {
        el.appendChild(render);
      } else {
        el.appendChild(document.createTextNode(render));
      }
    } else if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });

  return el;
}

/*
 * Mount a component to a container
 */
export function mount(component: () => HTMLElement, container: HTMLElement) {
  container.innerHTML = '';
  container.appendChild(component());
}
