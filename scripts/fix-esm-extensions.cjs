/*
  Post-build fixer: add .js extensions to relative ESM imports in dist/lib.esm
  - Rewrites `from './x'` → `from './x.js'`
  - Rewrites `from './dir'` where './dir/index.js' exists → `from './dir/index.js'`
  - Handles both import and export statements
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'lib.esm');

/** @param {string} p */
function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** @param {string} p */
function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** @param {string} code @param {string} fileDir */
function rewrite(code, fileDir) {
  // Matches import/export ... from '...'; capturing the specifier in group 2
  const re = /(import|export)\s+[^'";]*?from\s+(["'])([^"']+)(\2)/g;
  return code.replace(re, (m, kw, quote, spec, q2) => {
    if (!(spec.startsWith('./') || spec.startsWith('../'))) return m; // only relative

    const withoutQuery = spec.split('?')[0];
    const full = path.resolve(fileDir, withoutQuery);

    // If it already ends with .js/.mjs/.cjs, leave it
    if (/\.(js|mjs|cjs)$/.test(withoutQuery)) return m;

    // Try file.js
    if (isFile(full + '.js')) {
      return `${kw} from ${quote}${spec}.js${quote}`;
    }

    // Try directory index.js
    if (isDir(full) && isFile(path.join(full, 'index.js'))) {
      const suff = spec.endsWith('/') ? 'index.js' : '/index.js';
      return `${kw} from ${quote}${spec}${suff}${quote}`;
    }

    // Otherwise leave as-is
    return m;
  });
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (st.isFile() && p.endsWith('.js')) {
      const code = fs.readFileSync(p, 'utf8');
      const out = rewrite(code, path.dirname(p));
      if (out !== code) fs.writeFileSync(p, out);
    }
  }
}

if (!fs.existsSync(DIST)) {
  console.error('dist/lib.esm not found');
  process.exit(1);
}

walk(DIST);
console.log('Fixed ESM import extensions in dist/lib.esm');
