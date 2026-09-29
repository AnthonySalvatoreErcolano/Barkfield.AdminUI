/**
 * Checks that the markdown in this folder still describes the API in openapi.json.
 *
 * The numbers in API-CONTEXT.md section 1 are generated and cannot drift. This catches the prose that
 * can: an endpoint that was renamed, a permission that no longer guards anything, a path count typed
 * into a sentence. Run it after any endpoint change.
 *
 *   node contracts/audit.js        (from the repo root)
 *
 * Exits non-zero on a problem, so it can go in a pre-commit hook or CI step.
 */
const fs=require('fs');
const s=JSON.parse(fs.readFileSync('contracts/openapi.json','utf8'));
const files=['PAGES.md','API-CONTEXT.md','README.md','UI-KICKOFF.md'];
const docs=Object.fromEntries(files.map(f=>[f,fs.readFileSync('contracts/'+f,'utf8')]));
let problems=0;

for(const [name,md] of Object.entries(docs))
  for(const m of md.matchAll(/`(?:(?:GET|POST|PUT|DELETE) )?(\/api\/[A-Za-z0-9/{}._-]*)/g)){
    const p=m[1].replace(/[.,]+$/,'');
    // Skip templated paths, and prefixes written as a glob or trailing slash.
    if(p.includes('{') || p.endsWith('/') || s.paths[p]) continue;
    if(Object.keys(s.paths).some(k=>k.startsWith(p+'/'))) continue;
    console.log('MISSING PATH in '+name+':',p); problems++;
  }

const used=new Set();
for(const o of Object.values(s.paths)) for(const op of Object.values(o))
  if(op['x-required-permission']) used.add(op['x-required-permission']);

for(const [name,md] of Object.entries(docs))
  for(const m of md.matchAll(/`([a-z]+:[a-z]+)`/g))
    if(!used.has(m[1])){ console.log('UNUSED PERMISSION in '+name+':',m[1]); problems++; }

const pc=Object.keys(s.paths).length;
for(const [name,md] of Object.entries(docs))
  for(const m of md.matchAll(/(\d+) paths/g))
    if(+m[1]!==pc){ console.log('STALE PATH COUNT in '+name+':',m[1],'actual',pc); problems++; }

console.log(problems===0?'AUDIT CLEAN':problems+' problem(s)');

process.exit(problems === 0 ? 0 : 1);
