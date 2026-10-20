export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(
    date,
  );
}

export function sinceText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** Human label for a backend target ("" means the console's own origin). */
export function targetLabel(target: string): string {
  return target === '' ? `This backend (same origin, ${window.location.origin})` : target;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Agent notes arrive as Markdown; show them as plain readable text. */
export function readableNote(text?: string | null): string {
  return (text ?? '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

/** "range_violation" → "Range violation". */
export function humanize(code: string): string {
  const text = code.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
