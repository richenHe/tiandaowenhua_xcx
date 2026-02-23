const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../universal-cloudbase-uniapp-template/src/pages');

function scan(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...scan(f));
    else if (e.name.endsWith('.vue')) r.push(f);
  }
  return r;
}

const files = scan(PAGES_DIR);
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const matches = [...c.matchAll(/(\w+Api)\.(\w+)\s*\(/g)].map(m => m[1] + '.' + m[2]);
  const actions = [...c.matchAll(/action\s*:\s*['"](\w+)['"]/g)].map(m => 'action:' + m[1]);
  const all = [...new Set([...matches, ...actions])];
  if (all.length) {
    const rel = path.relative(PAGES_DIR, f).replace(/\\/g, '/');
    console.log(rel + ' -> ' + all.join(', '));
  }
}
