// Generates src/api/generated/ from contracts/openapi.json. Run with `npm run gen:api` whenever the
// contract file is replaced. Nothing in src/api/generated/ is edited by hand.
//
// Three outputs:
//   schema.ts       request/response types (openapi-typescript)
//   permissions.ts  operation → permission, and the anonymous set, from x-required-permission / x-anonymous
//   enums.ts        integer enums with their names, from x-enum-varnames / x-enum-names

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = resolve(root, 'contracts/openapi.json');
const outDir = resolve(root, 'src/api/generated');

const HEADER = '// GENERATED from contracts/openapi.json by scripts/generate-api.mjs — do not edit by hand.\n\n';
const METHODS = ['get', 'post', 'put', 'delete', 'patch'];

const spec = JSON.parse(readFileSync(specPath, 'utf8').replace(/^﻿/, ''));

// .NET 10 describes every number as "number or numeric string" because the server will *accept* a
// quoted number. It never *sends* one, so for typing purposes the string branch is noise that would
// make every count `number | string`. Drop it, and the pattern that goes with it.
function normalizeNumbers(node) {
  if (Array.isArray(node)) return node.forEach(normalizeNumbers);
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.type) && node.type.includes('string') && (node.type.includes('integer') || node.type.includes('number'))) {
    const rest = node.type.filter(t => t !== 'string');
    node.type = rest.length === 1 ? rest[0] : rest;
    delete node.pattern;
  }
  Object.values(node).forEach(normalizeNumbers);
}

// Only the JSON media type matters to a browser client; the text/plain and text/json duplicates
// otherwise triple every response union.
function keepJsonOnly(node) {
  if (Array.isArray(node)) return node.forEach(keepJsonOnly);
  if (!node || typeof node !== 'object') return;
  if (node.content && typeof node.content === 'object' && node.content['application/json']) {
    node.content = { 'application/json': node.content['application/json'] };
  }
  Object.values(node).forEach(keepJsonOnly);
}

const typed = structuredClone(spec);
normalizeNumbers(typed);
keepJsonOnly(typed);

mkdirSync(outDir, { recursive: true });

// --- schema.ts -----------------------------------------------------------------------------------
// propertiesRequiredByDefault: roughly half the DTOs carry no `required` array at all, and their
// nullable members are already typed `T | null`. Without this, every field of every response would
// be optional and every screen would be littered with `?.` against fields that are always present.
const ast = await openapiTS(typed, { propertiesRequiredByDefault: true, alphabetize: true });
writeFileSync(resolve(outDir, 'schema.ts'), HEADER + astToString(ast));

// --- permissions.ts ------------------------------------------------------------------------------
const permissions = {};
const anonymous = [];
for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of METHODS) {
    const op = item[method];
    if (!op) continue;
    const key = `${method.toUpperCase()} ${path}`;
    if (op['x-required-permission']) permissions[key] = op['x-required-permission'];
    else if (op['x-anonymous']) anonymous.push(key);
  }
}
const allPermissions = [...new Set(Object.values(permissions))].sort();

writeFileSync(resolve(outDir, 'permissions.ts'), HEADER +
`/** Every permission string some operation requires. */
export const PERMISSIONS = ${JSON.stringify(allPermissions, null, 2)} as const;

export type Permission = (typeof PERMISSIONS)[number];

/** \`METHOD /path\` → the permission that operation requires (x-required-permission). */
export const OPERATION_PERMISSIONS = ${JSON.stringify(permissions, null, 2)} as const satisfies Record<string, Permission>;

export type GatedOperation = keyof typeof OPERATION_PERMISSIONS;

/** Operations needing no token (x-anonymous). Anything in neither map needs sign-in but no permission. */
export const ANONYMOUS_OPERATIONS = ${JSON.stringify(anonymous, null, 2)} as const;
`);

// --- enums.ts ------------------------------------------------------------------------------------
let enums = '';
for (const [name, schema] of Object.entries(spec.components.schemas).sort(([a], [b]) => a.localeCompare(b))) {
  if (!schema.enum) continue;
  const varnames = schema['x-enum-varnames'] ?? schema['x-enum-names'];
  const labels = schema['x-enum-names'] ?? varnames;
  if (!varnames || varnames.length !== schema.enum.length) {
    throw new Error(`${name}: x-enum-varnames missing or does not match the enum values`);
  }
  const members = schema.enum.map((v, i) => `  ${varnames[i]}: ${v},`).join('\n');
  const names = schema.enum.map((v, i) => `  ${v}: ${JSON.stringify(labels[i])},`).join('\n');
  enums +=
`export const ${name} = {
${members}
} as const;
export type ${name} = (typeof ${name})[keyof typeof ${name}];
export const ${name}Names: Record<${name}, string> = {
${names}
};

`;
}
writeFileSync(resolve(outDir, 'enums.ts'), HEADER +
  '// Enums cross the wire as integers. Send the number (e.g. DeliveryStatus.Packed); use the Names map,\n' +
  '// or the DTO\'s own …Name field, for display.\n\n' + enums.trimEnd() + '\n');

console.log(`Generated ${Object.keys(permissions).length} gated operations, ${anonymous.length} anonymous, ` +
  `${allPermissions.length} permissions, ${Object.values(spec.components.schemas).filter(s => s.enum).length} enums.`);
