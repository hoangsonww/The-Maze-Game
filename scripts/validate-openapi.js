#!/usr/bin/env node
/**
 * Validate the OpenAPI spec: no broken $refs, every path has an operation,
 * every operation has responses. Exits non-zero on any problem (CI gate).
 *
 * Usage: node scripts/validate-openapi.js
 */

const { spec } = require('../server/swagger');

const problems = [];
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const schemas = (spec.components && spec.components.schemas) || {};
const refs = [...JSON.stringify(spec).matchAll(/#\/components\/schemas\/([A-Za-z0-9_]+)/g)].map(
  (m) => m[1]
);
for (const r of [...new Set(refs)]) {
  if (!schemas[r]) problems.push(`broken $ref: #/components/schemas/${r}`);
}

let operations = 0;
for (const [p, item] of Object.entries(spec.paths)) {
  const methods = Object.keys(item).filter((m) => METHODS.includes(m));
  if (methods.length === 0) problems.push(`path has no operations: ${p}`);
  for (const m of methods) {
    operations += 1;
    if (!item[m].responses || Object.keys(item[m].responses).length === 0) {
      problems.push(`missing responses: ${m.toUpperCase()} ${p}`);
    }
    if (!item[m].summary) problems.push(`missing summary: ${m.toUpperCase()} ${p}`);
  }
}

if (problems.length) {
  console.error('OpenAPI validation FAILED:');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}

console.log(
  `OpenAPI ${spec.openapi} valid: ${Object.keys(spec.paths).length} paths, ${operations} operations, ` +
    `${Object.keys(schemas).length} schemas, ${spec.tags.length} tags.`
);
