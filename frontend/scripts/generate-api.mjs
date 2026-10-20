// Generates packages/api-client/src/generated/schema.d.ts from the backend's FastAPI schema.
// Default source is the local backend; override with POKAYOKE_OPENAPI_URL.
// If the schema is unreachable the app keeps using the hand-written types in
// packages/api-client/src/hand-written/schema.ts (see packages/api-client/src/schema.ts).
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.env.POKAYOKE_OPENAPI_URL || 'http://localhost:8080/openapi.json';
const url = new URL(base);
if (!['https:', 'http:'].includes(url.protocol))
  throw new Error('OpenAPI URL must use HTTP or HTTPS.');

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  console.error(
    `Could not read ${url.href} (${error instanceof Error ? error.message : String(error)}).\n` +
      'Start the backend or set POKAYOKE_OPENAPI_URL. The hand-written types stay in use.',
  );
  process.exit(1);
}

mkdirSync('packages/api-client/src/generated', { recursive: true });
// Launch Node directly: a schema URL must never be interpolated into cmd.exe.
const cli = fileURLToPath(
  new URL('../node_modules/openapi-typescript/bin/cli.js', import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [cli, url.href, '-o', 'packages/api-client/src/generated/schema.d.ts'],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
if (result.status === 0)
  console.log('Generated. Point packages/api-client/src/schema.ts at ./generated/schema.');
process.exit(result.status ?? 1);
