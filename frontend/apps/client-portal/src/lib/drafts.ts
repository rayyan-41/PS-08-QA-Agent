import { z } from 'zod';

const recentDraftSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  receiptId: z.string().min(1).optional(),
});
export type RecentDraft = z.infer<typeof recentDraftSchema>;
const storageKey = 'pokayoke.client-portal.recent-drafts.v1';
const changedEvent = 'pokayoke:portal-drafts-changed';

/** Only local navigation metadata is cached. Status and acceptance come from the API. */
export function readRecentDrafts(): RecentDraft[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .flatMap((item: unknown) => {
        const parsed = recentDraftSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function saveRecentDraft(record: RecentDraft): void {
  const validated = recentDraftSchema.parse(record);
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(
        [validated, ...readRecentDrafts().filter((entry) => entry.id !== record.id)].slice(0, 30),
      ),
    );
    window.dispatchEvent(new Event(changedEvent));
  } catch {
    // Private mode or a full storage quota must not block an uploaded draft's route.
  }
}

export function updateRecentDraft(
  id: string,
  patch: Partial<Pick<RecentDraft, 'version' | 'receiptId'>>,
): void {
  const current = readRecentDrafts().find((entry) => entry.id === id);
  if (current) saveRecentDraft({ ...current, ...patch, updatedAt: new Date().toISOString() });
}

export function watchRecentDrafts(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(changedEvent, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(changedEvent, listener);
  };
}

export function platformDraftUrl(
  platformUrl: string,
  id: string,
  portalOrigin = window.location.origin,
): string {
  if (!platformUrl || !id) return '';
  const destination = new URL(
    `${platformUrl.replace(/\/+$/, '')}/jobs/${encodeURIComponent(id)}/profile`,
  );
  destination.searchParams.set('return', `${portalOrigin}/import/${encodeURIComponent(id)}`);
  return destination.toString();
}
