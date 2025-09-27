// Test setup
import { JSDOM } from 'jsdom';

// Create virtual DOM for tests
const dom = new JSDOM(
  `
  <!DOCTYPE html>
  <html>
    <head><title>Test</title></head>
    <body></body>
  </html>
`,
  {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  },
);

// Set global objects
global.window = dom.window as any;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.CustomEvent = dom.window.CustomEvent;
