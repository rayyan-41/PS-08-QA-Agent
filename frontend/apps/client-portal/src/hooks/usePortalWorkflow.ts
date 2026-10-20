import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Draft, Receipt } from '@pokayoke/api-client';
import { createPortalApi, PortalApiError } from '../api/portal-api';
import {
  platformDraftUrl,
  readRecentDrafts,
  saveRecentDraft,
  updateRecentDraft,
  watchRecentDrafts,
} from '../lib/drafts';

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.';

function useRecentDrafts() {
  const [drafts, setDrafts] = useState(readRecentDrafts);
  useEffect(() => watchRecentDrafts(() => setDrafts(readRecentDrafts())), []);
  return drafts;
}

export function usePortalHome(apiBaseUrl: string) {
  const api = useMemo(() => createPortalApi(apiBaseUrl), [apiBaseUrl]);
  const drafts = useRecentDrafts();
  const knownReceipts = drafts.flatMap((draft) =>
    draft.receiptId ? [{ ...draft, receiptId: draft.receiptId }] : [],
  );
  const receiptQueries = useQueries({
    queries: knownReceipts.map((draft) => ({
      queryKey: ['portal', apiBaseUrl, 'receipt', draft.receiptId],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.getReceipt(draft.receiptId, { signal }),
      retry: false,
    })),
  });
  const receipts = receiptQueries.flatMap((query) => {
    const receipt = query.data;
    return receipt &&
      drafts.some((draft) => draft.id === receipt.draft_id && draft.version === receipt.version)
      ? [receipt]
      : [];
  });
  return {
    drafts,
    receipts,
    refresh: () => {
      for (const query of receiptQueries) void query.refetch();
    },
  };
}

export function usePortalImport(apiBaseUrl: string, onCreated?: (id: string) => void) {
  const api = useMemo(() => createPortalApi(apiBaseUrl), [apiBaseUrl]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const selectFile = (selected: File | null) => {
    if (upload.isPending) return;
    upload.reset();
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setFile(null);
      setFileError('Choose a CSV file.');
      return;
    }
    if (selected.size === 0) {
      setFile(null);
      setFileError('This file is empty. Choose a CSV containing data.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError('Choose a CSV no larger than 10 MB.');
      return;
    }
    setFile(selected);
    setFileError(null);
  };
  const upload = useMutation({
    retry: false,
    mutationFn: async (selected: File) => {
      const created = await api.upload(selected);
      const now = new Date().toISOString();
      // Save the uploaded ID before inspection so retries never upload a second copy.
      saveRecentDraft({
        id: created.draft_id,
        version: created.version,
        filename: selected.name,
        createdAt: now,
        updatedAt: now,
      });
      return created;
    },
    onSuccess: (created) => onCreated?.(created.draft_id),
  });
  const sample = useMutation({
    retry: false,
    mutationFn: async () => {
      const response = await fetch('/ps08_data_entries.csv', {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok)
        throw new Error(`Sample CSV could not be loaded (HTTP ${response.status}).`);
      const blob = await response.blob();
      return new File([blob], 'ps08_data_entries.csv', { type: 'text/csv' });
    },
    onSuccess: selectFile,
  });
  const fileSummary: { name: string; sizeLabel: string; rowCount?: number } | undefined = file
    ? {
        name: file.name,
        sizeLabel:
          file.size >= 1024 * 1024
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
            : `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
      }
    : undefined;
  return {
    file,
    fileError,
    fileSummary,
    selectFile,
    useSample: () => sample.mutate(),
    samplePending: sample.isPending,
    submit: () => {
      if (file && !upload.isPending) upload.mutate(file);
      else if (!file) setFileError('Choose a CSV file before sending it for review.');
    },
    pending: upload.isPending,
    error: upload.error ? message(upload.error) : sample.error ? message(sample.error) : null,
  };
}

function receiptIdFrom(draft: Draft | undefined, storedId?: string): string | undefined {
  // An undocumented optional field is only a lookup hint; GET accepted confirms it.
  return typeof draft?.receipt_id === 'string' && draft.receipt_id ? draft.receipt_id : storedId;
}

export function usePortalSubmission(apiBaseUrl: string, id: string, platformUrl = '') {
  const api = useMemo(() => createPortalApi(apiBaseUrl), [apiBaseUrl]);
  const queryClient = useQueryClient();
  const recentDrafts = useRecentDrafts();
  const recentDraft = recentDrafts.find((item) => item.id === id);
  const draftKey = ['portal', apiBaseUrl, 'draft', id];
  const draftQuery = useQuery({
    queryKey: draftKey,
    enabled: Boolean(id),
    retry: false,
    queryFn: ({ signal }) => api.getDraft(id, { signal }),
    refetchInterval: 5_000,
  });
  const draft = draftQuery.data;
  const inspect = useMutation({
    retry: false,
    mutationFn: () => api.inspect(id),
    onSuccess: (result) => {
      updateRecentDraft(id, { version: result.version });
      void queryClient.invalidateQueries({ queryKey: draftKey });
    },
  });
  const attemptedInspection = useRef('');
  useEffect(() => {
    if (draft?.status === 'uploaded' && attemptedInspection.current !== id) {
      attemptedInspection.current = id;
      inspect.mutate();
    }
  }, [draft?.status, id, inspect]);
  useEffect(() => {
    if (draft && recentDraft && draft.version !== recentDraft.version)
      updateRecentDraft(id, { version: draft.version });
  }, [draft, recentDraft, id]);
  const reviewQuery = useQuery({
    queryKey: ['portal', apiBaseUrl, 'review', id, draft?.version],
    queryFn: ({ signal }) => api.getReview(id, { signal }),
    enabled: Boolean(draft && draft.status !== 'uploaded'),
    retry: false,
    refetchInterval: 5_000,
  });
  const receiptId = receiptIdFrom(draft, recentDraft?.receiptId);
  const receiptQuery = useQuery({
    queryKey: ['portal', apiBaseUrl, 'receipt', receiptId],
    queryFn: ({ signal }) => {
      if (!receiptId) throw new Error('An acceptance receipt reference is required.');
      return api.getReceipt(receiptId, { signal });
    },
    enabled: Boolean(receiptId),
    retry: false,
  });
  const receipt: Receipt | undefined =
    receiptQuery.data?.draft_id === id && receiptQuery.data.version === draft?.version
      ? receiptQuery.data
      : undefined;
  useEffect(() => {
    if (receipt && receipt.id !== recentDraft?.receiptId)
      updateRecentDraft(id, { receiptId: receipt.id });
  }, [id, receipt, recentDraft?.receiptId]);
  const review = reviewQuery.data?.draft_version === draft?.version ? reviewQuery.data : undefined;
  const previewColumns = draft?.inspection?.columns.map((column) => column.name) ?? [];
  const previewRows =
    draft?.inspection?.preview.map((row) =>
      previewColumns.map((name) => String(row[name] ?? '')),
    ) ?? [];
  const warningMessages =
    draft?.inspection?.warnings.map((warning) =>
      typeof warning === 'string' ? warning : JSON.stringify(warning),
    ) ?? [];
  const statusLabel = receipt
    ? 'Accepted'
    : draft?.status === 'uploaded'
      ? 'Pending inspection'
      : draft?.status === 'inspected'
        ? 'Ready for QA profile'
        : (draft?.status ?? 'Loading draft');
  const missingReview =
    reviewQuery.error instanceof PortalApiError && reviewQuery.error.status === 404;
  const error =
    draftQuery.error ?? (!missingReview ? reviewQuery.error : null) ?? receiptQuery.error;
  return {
    draft,
    review,
    receipt,
    recentDraft,
    filename:
      recentDraft?.filename ??
      (typeof draft?.filename === 'string' ? draft.filename : 'Imported CSV'),
    statusLabel,
    previewColumns,
    previewRows,
    warningMessages,
    platformReviewUrl: platformDraftUrl(platformUrl, id),
    downloadUrl: receipt ? api.downloadUrl(receipt.id) : undefined,
    isPending: draftQuery.isPending,
    isRefreshing: draftQuery.isFetching || reviewQuery.isFetching || receiptQuery.isFetching,
    error: error ? message(error) : null,
    inspectPending: inspect.isPending,
    inspectError: inspect.error ? message(inspect.error) : null,
    retryInspect: () => {
      if (!inspect.isPending) inspect.mutate();
    },
    refresh: () => {
      void draftQuery.refetch();
      if (draft && draft.status !== 'uploaded') void reviewQuery.refetch();
      if (receiptId) void receiptQuery.refetch();
    },
  };
}
