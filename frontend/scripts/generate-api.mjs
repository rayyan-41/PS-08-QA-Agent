import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const base = process.env.POKAYOKE_OPENAPI_URL;
if (!base)
  throw new Error(
    'Set POKAYOKE_OPENAPI_URL to the backend OpenAPI document. No schema has been assumed.',
  );
const url = new URL(base);
if (!['https:', 'http:'].includes(url.protocol))
  throw new Error('OpenAPI URL must use HTTP or HTTPS.');
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
process.exit(result.status ?? 1);
