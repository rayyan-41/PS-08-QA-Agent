import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp } from '@pokayoke/ui';
import type { Reference } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { ErrorPanel } from '../components/states';
import { rememberJob } from '../lib/recent-jobs';
import { formatBytes, MAX_UPLOAD_BYTES } from '../lib/format';
import { writeJson } from '../lib/storage';

type Stage = 'idle' | 'uploading' | 'inspecting';

/** Upload (POST /api/drafts) then inspect (POST /api/drafts/{id}/inspect). */
export function NewJobScreen() {
  const { backend, target } = useBackend();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string>();
  const [stage, setStage] = useState<Stage>('idle');
  const [createdId, setCreatedId] = useState<string>();

  const start = useMutation({
    mutationFn: async (selected: File) => {
      // Reuse an already-created draft if only inspection failed before.
      let draftId = createdId;
      if (!draftId) {
        setStage('uploading');
        const created = await backend.createDraft(selected);
        draftId = created.draft_id;
        setCreatedId(draftId);
        rememberJob({
          id: draftId,
          filename: selected.name,
          createdAt: new Date().toISOString(),
          target,
        });
      }
      setStage('inspecting');
      const inspected = await backend.inspect(draftId);
      return { draftId, inspected };
    },
    onSuccess: ({ draftId }) => {
      void queryClient.invalidateQueries({ queryKey: keys.draft(target, draftId) });
      navigate(`/jobs/${draftId}/intake`);
    },
    onSettled: () => setStage('idle'),
  });

  function choose(selected: File | null) {
    setLocalError(undefined);
    setCreatedId(undefined);
    start.reset();
    setFile(selected);
    if (selected && selected.size > MAX_UPLOAD_BYTES) {
      setLocalError(
        `${selected.name} is ${formatBytes(selected.size)}. The limit is 10 MB. Split the file or remove unused columns, then upload again.`,
      );
    }
  }

  return (
    <section className="page page--narrow">
      <header className="page__head">
        <div>
          <h1>New job</h1>
          <p className="muted">
            Upload a CSV with a header row, up to 10 MB. Pokayoke stores the original file and
            inspects every row.
          </p>
        </div>
      </header>

      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!file) {
            setLocalError('Choose a CSV file first.');
            return;
          }
          if (localError) return;
          start.mutate(file);
        }}
      >
        <div className="field">
          <label htmlFor={fileId}>Draft file (CSV)</label>
          <input
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
            aria-describedby={localError ? `${fileId}-error` : undefined}
          />
          {file ? (
            <p className="muted mono">
              {file.name} · {formatBytes(file.size)}
            </p>
          ) : null}
          {localError ? (
            <p id={`${fileId}-error`} className="field__error" role="alert">
              {localError}
            </p>
          ) : null}
        </div>

        {start.error ? (
          <ErrorPanel
            error={start.error}
            title={createdId ? 'The file was uploaded but inspection failed' : 'Upload failed'}
            retryLabel={createdId ? 'Retry inspection' : 'Retry upload'}
            onRetry={() => file && start.mutate(file)}
          />
        ) : null}

        <div className="row">
          <button type="submit" className="btn btn--primary" disabled={start.isPending}>
            <FileUp aria-hidden size={16} />
            {stage === 'uploading'
              ? 'Uploading…'
              : stage === 'inspecting'
                ? 'Inspecting all rows…'
                : 'Upload and inspect'}
          </button>
          {createdId ? <span className="muted mono">Job {createdId}</span> : null}
        </div>
      </form>

      <ReferenceUpload />
    </section>
  );
}

const REFERENCE_KEY = 'pokayoke.lastReference';

/** Optional historical CSV (POST /api/references). Labels in it are not verified. */
export function ReferenceUpload({ onUploaded }: { onUploaded?: (reference: Reference) => void }) {
  const { backend } = useBackend();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [tooBig, setTooBig] = useState(false);
  const upload = useMutation({
    mutationFn: (selected: File) => backend.uploadReference(selected),
    onSuccess: (reference) => {
      writeJson(REFERENCE_KEY, reference);
      onUploaded?.(reference);
    },
  });

  return (
    <form
      className="panel stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (file && !tooBig) upload.mutate(file);
      }}
    >
      <h2 className="h3">Historical reference (optional)</h2>
      <p className="muted">
        A past CSV the checks can compare against. Its labels are unverified: they are treated as
        analyst-supplied history, not ground truth.
      </p>
      <div className="field">
        <label htmlFor={inputId}>Reference file (CSV, labels unverified)</label>
        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setTooBig(Boolean(selected && selected.size > MAX_UPLOAD_BYTES));
            upload.reset();
          }}
        />
        {tooBig ? (
          <p className="field__error" role="alert">
            This file is over the 10 MB limit.
          </p>
        ) : null}
      </div>
      {upload.error ? <ErrorPanel error={upload.error} title="Reference upload failed" /> : null}
      {upload.data ? (
        <dl className="facts">
          <dt>Reference ID</dt>
          <dd className="mono">{upload.data.id}</dd>
          <dt>File</dt>
          <dd>{upload.data.filename}</dd>
          <dt>Rows</dt>
          <dd className="mono">{upload.data.row_count}</dd>
          <dt>Labels verified</dt>
          <dd>{upload.data.labels_verified ? 'Yes' : 'No (unverified)'}</dd>
          <dt>Role</dt>
          <dd>{upload.data.role}</dd>
        </dl>
      ) : null}
      <div className="row">
        <button type="submit" className="btn btn--secondary" disabled={upload.isPending || !file}>
          {upload.isPending ? 'Uploading…' : 'Upload reference'}
        </button>
      </div>
    </form>
  );
}

export function readLastReference(): Reference | undefined {
  try {
    const raw = window.localStorage.getItem(REFERENCE_KEY);
    return raw ? (JSON.parse(raw) as Reference) : undefined;
  } catch {
    return undefined;
  }
}
