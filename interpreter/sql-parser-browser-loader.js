(function (root) {
  'use strict';

  async function loadParser(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load parser from ${url}: ${response.status} ${response.statusText}`);
    }

    const source = await response.text();
    const module = { exports: {} };
    const exports = module.exports;
    const require = function () {
      throw new Error('The generated SQL parser does not support runtime require() in the browser loader.');
    };
    const factory = new Function('module', 'exports', 'require', `${source}\nreturn module.exports;`);
    root.MaiaSQLParser = factory(module, exports, require);
    root.dispatchEvent(new CustomEvent('maiasql:parser-ready', { detail: { parser: root.MaiaSQLParser } }));
    return root.MaiaSQLParser;
  }

  root.MaiaSQLBrowserLoader = { loadParser: loadParser };
}(typeof globalThis !== 'undefined' ? globalThis : this));
