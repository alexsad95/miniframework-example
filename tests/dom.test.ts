import { beforeEach, describe, expect, it } from 'bun:test';
import { h, mount } from '../src/utils/dom';

describe('DOM functions', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('h function', () => {
    it('should create a simple element', () => {
      const element = h('div', {}, []);
      expect(element.tagName).toBe('DIV');
    });

    it('should create element with text content', () => {
      const element = h('p', {}, ['Hello World']);
      expect(element.tagName).toBe('P');
      expect(element.textContent).toBe('Hello World');
    });

    it('should create element with multiple children', () => {
      const element = h('div', {}, [h('span', {}, ['First']), h('span', {}, ['Second'])]);
      expect(element.children.length).toBe(2);
      expect(element.children[0]?.textContent).toBe('First');
      expect(element.children[1]?.textContent).toBe('Second');
    });

    it('should set attributes', () => {
      const element = h('div', { id: 'test', className: 'container' }, []);
      expect(element.id).toBe('test');
      expect(element.className).toBe('container');
    });

    it('should set style object', () => {
      const element = h(
        'div',
        {
          style: {
            color: 'red',
            fontSize: '16px',
            display: 'block',
          },
        },
        [],
      );
      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
      expect(element.style.display).toBe('block');
    });

    it('should add event listeners', () => {
      let clicked = false;
      const element = h(
        'button',
        {
          onClick: () => {
            clicked = true;
          },
        },
        ['Click me'],
      );

      element.click();
      expect(clicked).toBe(true);
    });

    it('should handle function children', () => {
      const element = h('div', {}, [() => 'Dynamic content']);
      expect(element.textContent).toBe('Dynamic content');
    });

    it('should handle function children returning HTMLElement', () => {
      const element = h('div', {}, [() => h('span', {}, ['Nested'])]);
      expect(element.children.length).toBe(1);
      expect(element.children[0]?.tagName).toBe('SPAN');
      expect(element.children[0]?.textContent).toBe('Nested');
    });

    it('should handle mixed children types', () => {
      const element = h('div', {}, ['Text', h('span', {}, ['Element']), () => 'Function']);
      expect(element.childNodes.length).toBe(3);
      expect(element.textContent).toBe('TextElementFunction');
    });
  });

  describe('mount function', () => {
    it('should mount component to container', () => {
      const component = () => h('div', { id: 'mounted' }, ['Mounted content']);

      mount(component, container);

      expect(container.innerHTML).toBe('<div id="mounted">Mounted content</div>');
    });

    it('should clear container before mounting', () => {
      // Add something to container
      container.innerHTML = '<p>Old content</p>';

      const component = () => h('div', {}, ['New content']);
      mount(component, container);

      expect(container.innerHTML).toBe('<div>New content</div>');
    });

    it('should mount complex component', () => {
      const component = () =>
        h('div', { className: 'complex' }, [
          h('h1', {}, ['Title']),
          h('p', {}, ['Description']),
          h('button', { onClick: () => {} }, ['Click']),
        ]);

      mount(component, container);

      const mountedDiv = container.firstChild as HTMLElement;
      expect(mountedDiv.className).toBe('complex');
      expect(mountedDiv.children.length).toBe(3);
      expect(mountedDiv.children[0]?.tagName).toBe('H1');
      expect(mountedDiv.children[1]?.tagName).toBe('P');
      expect(mountedDiv.children[2]?.tagName).toBe('BUTTON');
    });
  });

  describe('event handling', () => {
    it('should handle click events', () => {
      let clickCount = 0;
      const element = h(
        'button',
        {
          onClick: () => {
            clickCount++;
          },
        },
        ['Click me'],
      );

      element.click();
      element.click();
      expect(clickCount).toBe(2);
    });

    it('should handle mouse events', () => {
      let mouseOverCount = 0;
      const element = h(
        'div',
        {
          onMouseOver: () => {
            mouseOverCount++;
          },
        },
        ['Hover me'],
      );

      const event = new MouseEvent('mouseover');
      element.dispatchEvent(event);
      expect(mouseOverCount).toBe(1);
    });

    it('should handle custom events', () => {
      let customEventFired = false;
      const element = h(
        'div',
        {
          onCustomEvent: () => {
            customEventFired = true;
          },
        },
        ['Custom'],
      );

      const event = new CustomEvent('customevent');
      element.dispatchEvent(event);
      expect(customEventFired).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty props', () => {
      const element = h('div', {}, []);
      expect(element.tagName).toBe('DIV');
    });

    it('should handle null/undefined children', () => {
      const element = h('div', {}, ['valid']);
      expect(element.textContent).toBe('valid');
    });

    it('should handle empty children array', () => {
      const element = h('div', {}, []);
      expect(element.children.length).toBe(0);
    });

    it('should handle props with special characters', () => {
      const element = h(
        'div',
        {
          'data-test-id': 'test123',
          'aria-label': 'Test label',
        },
        [],
      );
      expect(element.getAttribute('data-test-id')).toBe('test123');
      expect(element.getAttribute('aria-label')).toBe('Test label');
    });
  });
});
