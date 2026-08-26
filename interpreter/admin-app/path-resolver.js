'use strict';

function buildParserCandidates(currentUrl) {
  const current = new URL(currentUrl, 'http://localhost');
  const origin = current.origin;
  const pathname = current.pathname.replace(/\/+$/, '');
  const segments = pathname && pathname !== '/' ? pathname.split('/').filter(Boolean) : [];

  const candidates = new Set();

  function addRelative(relativePath) {
    try {
      candidates.add(new URL(relativePath, current).href);
    } catch (error) {
      // Ignore invalid relative URLs.
    }
  }

  function addAbsolute(prefixSegments) {
    const normalized = prefixSegments.filter(Boolean);
    const path = normalized.length ? '/' + normalized.join('/') + '/sql-parser.js' : '/sql-parser.js';
    try {
      candidates.add(new URL(path, origin).href);
    } catch (error) {
      // Ignore invalid absolute URLs.
    }
  }

  [
    '../sql-parser.js',
    './sql-parser.js',
    './interpreter/sql-parser.js',
    '../interpreter/sql-parser.js',
    '/interpreter/sql-parser.js',
    '/sql-parser.js'
  ].forEach(addRelative);

  for (let i = 0; i <= segments.length; i += 1) {
    addAbsolute(segments.slice(0, i));
  }

  return Array.from(candidates);
}

if (typeof window !== 'undefined') {
  window.MaiaSQLAdminPathResolver = { buildParserCandidates };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildParserCandidates };
}
