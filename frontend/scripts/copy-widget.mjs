import { mkdir, copyFile } from 'node:fs/promises';
const target = new URL('../apps/platform/dist/widget/v1/', import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(
  new URL('../packages/widget/dist/pokayoke-widget.js', import.meta.url),
  new URL('pokayoke-widget.js', target),
);
