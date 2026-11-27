export const documents = {
  GUIDE: ['Language guide', 'docs/GUIDE.md'],
  ARTICLE: ['The paper', 'docs/ARTICLE.md'],
  SPECIFICATION: ['Specification', 'docs/SPECIFICATION.md'],
  UNIVERSALITY: ['Universality proof', 'docs/UNIVERSALITY.md'],
  ARCHITECTURE: ['Architecture', 'docs/ARCHITECTURE.md'],
  OPTIMIZATION: ['Optimizations', 'docs/OPTIMIZATION.md'],
  BENCHMARKS: ['Benchmarks', 'bench/RESULTS.md'],
  RELATED_WORK: ['Related work', 'docs/RELATED_WORK.md'],
  VALIDATION: ['Validation report', 'docs/VALIDATION.md'],
  PAGES: ['GitHub Pages setup', 'docs/PAGES.md'],
};

const repository = 'https://github.com/tverderesi/einstein';
const routeFor = path => {
  const entry = Object.entries(documents).find(([, value]) => value[1] === path);
  return entry ? '#' + entry[0] : null;
};

export function resolveDocLink(href, documentPath, pageURL) {
  if (href.startsWith('#')) return href;
  const base = new URL('../', pageURL);
  const resolved = new URL(href, new URL(documentPath, base));
  const sourcePrefix = repository + '/blob/main/';
  if (resolved.href.startsWith(sourcePrefix)) {
    const path = resolved.pathname.slice('/tverderesi/einstein/blob/main/'.length);
    return routeFor(path) || href;
  }
  if (/^https?:\/\//.test(href) &&
      (resolved.origin !== base.origin || !resolved.pathname.startsWith(base.pathname))) {
    return href;
  }
  const path = resolved.pathname.startsWith(base.pathname)
    ? resolved.pathname.slice(base.pathname.length)
    : resolved.pathname.replace(/^\//, '');
  return routeFor(path) || repository + '/blob/main/' + path;
}
