import { Link, Route, Routes, useNavigate, useParams } from 'react-router';
import type { ReactNode } from 'react';
import type { PortalConfig } from './config';
import { usePortalHome, usePortalImport, usePortalSubmission } from './hooks/usePortalWorkflow';
import {
  FilePicker,
  InlineError,
  PageHeading,
  PortalShell,
  StatusBadge,
} from './components/PortalElements';

export function App({ config }: { config: PortalConfig }) {
  return (
    <PortalShell>
      {!config.apiReady ? (
        <InlineError>
          The review service is not connected to this workspace. You can choose a file, but sending
          it for review is unavailable. Please contact your workspace administrator.
        </InlineError>
      ) : null}
      <Routes>
        <Route path="/" element={<HomePage config={config} />} />
        <Route path="/import" element={<ImportPage config={config} />} />
        <Route path="/import/:id" element={<SubmissionPage config={config} />} />
        <Route path="*" element={<MissingPage />} />
      </Routes>
    </PortalShell>
  );
}

function HomePage({ config }: { config: PortalConfig }) {
  const { drafts, receipts, refresh } = usePortalHome(config.apiBaseUrl);
  return (
    <>
      <PageHeading
        eyebrow="Research operations"
        title="Company financials"
        description="Import company figures, review their quality, and keep accepted data in one place."
      >
        <Link className="portal-button portal-button--primary" to="/import">
          Import figures <span aria-hidden="true">↗</span>
        </Link>
      </PageHeading>
      <section className="portal-surface" aria-labelledby="accepted-heading">
        <div className="portal-section-heading">
          <div>
            <h2 id="accepted-heading">Accepted records</h2>
            <p>Only reviewed and released batches belong in your database.</p>
          </div>
          <StatusBadge>Review before acceptance</StatusBadge>
        </div>
        {receipts.length > 0 ? (
          <div className="portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Acceptance receipt</th>
                  <th scope="col">Records</th>
                  <th scope="col">Version</th>
                  <th scope="col">Accepted at</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="portal-code">{receipt.id}</td>
                    <td>{receipt.row_count}</td>
                    <td>{receipt.version}</td>
                    <td>{receipt.accepted_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AcceptedEmptyState />
        )}
      </section>
      <section className="portal-import-history" aria-labelledby="imports-heading">
        <div className="portal-section-heading">
          <div>
            <h2 id="imports-heading">Recent imports</h2>
            <p>Imports started in this browser. Pending figures stay outside the database.</p>
          </div>
          <button className="portal-text-button" onClick={refresh}>
            Refresh status
          </button>
        </div>
        {drafts.length ? (
          <div className="portal-surface portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">File</th>
                  <th scope="col">Draft reference</th>
                  <th scope="col">Version</th>
                  <th scope="col">
                    <span className="portal-sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id}>
                    <td>
                      <strong>{draft.filename}</strong>
                    </td>
                    <td className="portal-code">{draft.id}</td>
                    <td>{draft.version}</td>
                    <td>
                      <Link to={`/import/${draft.id}`}>
                        View submission <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="portal-history-empty">No imports started yet.</div>
        )}
      </section>
    </>
  );
}

function AcceptedEmptyState() {
  return (
    <div className="portal-empty">
      <div className="portal-empty-mark" aria-hidden="true">
        HR
      </div>
      <h3>No records yet.</h3>
      <p>Import this quarter’s figures to get started.</p>
      <Link className="portal-text-link" to="/import">
        Import your first figures <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function ImportPage({ config }: { config: PortalConfig }) {
  const navigate = useNavigate();
  const flow = usePortalImport(config.apiBaseUrl, (id) => navigate(`/import/${id}`));
  return (
    <>
      <Link className="portal-back" to="/">
        ← Company financials
      </Link>
      <PageHeading
        eyebrow="New submission"
        title="Import figures"
        description="Choose a CSV of company financials to send for quality review."
      />
      <div className="portal-workspace">
        <section className="portal-surface portal-upload-panel" aria-labelledby="source-heading">
          <div className="portal-section-heading">
            <div>
              <h2 id="source-heading">Source file</h2>
              <p>CSV format · Up to 10 MB</p>
            </div>
            <span className="portal-step">01 / 02</span>
          </div>
          <FilePicker
            file={flow.file}
            disabled={flow.pending || flow.samplePending}
            onSelect={flow.selectFile}
          />
          {flow.fileSummary ? (
            <div className="portal-file-meta" role="status">
              <strong>{flow.fileSummary.name}</strong>
              <span>{flow.fileSummary.sizeLabel}</span>
              {flow.fileSummary.rowCount !== undefined ? (
                <span>{flow.fileSummary.rowCount} rows · preview only</span>
              ) : null}
            </div>
          ) : null}
          {flow.fileError ? <InlineError>{flow.fileError}</InlineError> : null}
          <div className="portal-sample-row">
            <div>
              <strong>Try the supplied financial dataset</strong>
              <p>Use the event’s PS-08 sample CSV.</p>
            </div>
            <button
              className="portal-button portal-button--secondary"
              disabled={flow.pending || flow.samplePending}
              onClick={flow.useSample}
            >
              {flow.samplePending ? 'Loading sample…' : 'Use sample file'}
            </button>
          </div>
          {flow.error ? <InlineError>{flow.error}</InlineError> : null}
          <div className="portal-submit-row">
            <button
              className="portal-button portal-button--primary"
              disabled={
                !config.apiReady ||
                !flow.file ||
                !!flow.fileError ||
                flow.pending ||
                flow.samplePending
              }
              onClick={flow.submit}
            >
              {flow.pending ? 'Sending file…' : 'Send for review'} <span aria-hidden="true">→</span>
            </button>
            <p>
              Submissions are checked by <strong>Pokayoke</strong> before they are saved.
            </p>
          </div>
        </section>
        <ImportNotes />
      </div>
    </>
  );
}

function ImportNotes() {
  return (
    <aside className="portal-import-notes">
      <span className="portal-kicker">Before you submit</span>
      <h2>
        Review first.
        <br />
        Save with confidence.
      </h2>
      <ol>
        <li>
          <strong>Import your figures</strong>
          <p>Your file becomes a draft. Nothing is accepted yet.</p>
        </li>
        <li>
          <strong>Review in Pokayoke</strong>
          <p>Confirm the review profile, run checks, and resolve any findings.</p>
        </li>
        <li>
          <strong>Release the reviewed batch</strong>
          <p>Only an approved batch can enter the database.</p>
        </li>
      </ol>
    </aside>
  );
}

function SubmissionPage({ config }: { config: PortalConfig }) {
  const { id = '' } = useParams();
  const flow = usePortalSubmission(config.apiBaseUrl, id, config.platformUrl);
  return (
    <>
      <Link className="portal-back" to="/">
        ← Company financials
      </Link>
      <PageHeading
        eyebrow="Submission status"
        title={flow.receipt ? 'Batch accepted' : 'Waiting for quality review'}
        description="Track this submission before it reaches the company database."
      >
        <button
          className="portal-button portal-button--secondary"
          onClick={flow.refresh}
          disabled={flow.isRefreshing}
        >
          {flow.isRefreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </PageHeading>
      <div className="portal-workspace">
        <div className="portal-submission-main">
          <section className="portal-surface portal-draft-panel" aria-labelledby="draft-heading">
            <div className="portal-section-heading">
              <div>
                <h2 id="draft-heading">{flow.filename || 'Imported figures'}</h2>
                <p className="portal-code">Draft {id}</p>
              </div>
              <StatusBadge>{flow.statusLabel}</StatusBadge>
            </div>
            {flow.error ? <InlineError>{flow.error}</InlineError> : null}
            {flow.isPending ? (
              <div className="portal-loading" role="status">
                Loading submission…
              </div>
            ) : null}
            {flow.inspectPending ? (
              <div className="portal-loading" role="status">
                Inspecting your CSV…
              </div>
            ) : null}
            {flow.inspectError ? (
              <div className="portal-inspection-error">
                <InlineError>{flow.inspectError}</InlineError>
                <p>Your file is uploaded. Retry inspection without uploading it again.</p>
                <button
                  className="portal-button portal-button--secondary"
                  onClick={flow.retryInspect}
                  disabled={flow.inspectPending}
                >
                  Retry inspection
                </button>
              </div>
            ) : null}
            {flow.draft?.inspection ? (
              <InspectionPreview
                columns={flow.previewColumns}
                rows={flow.previewRows}
                rowCount={flow.draft.inspection.row_count}
                columnCount={flow.draft.inspection.column_count}
                version={flow.draft.version}
                warnings={flow.warningMessages}
              />
            ) : null}
            {flow.receipt ? (
              <div className="portal-receipt">
                <h3>Acceptance confirmed</h3>
                <p>
                  {flow.receipt.row_count} records accepted · Version {flow.receipt.version}
                </p>
                <p className="portal-code">Receipt {flow.receipt.id}</p>
                {flow.downloadUrl ? (
                  <a className="portal-button portal-button--secondary" href={flow.downloadUrl}>
                    Download accepted CSV
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="portal-not-accepted">
                These figures are not in the accepted database yet.
              </p>
            )}
          </section>
        </div>
        <QualityPanel
          ready={!!flow.draft?.inspection}
          href={flow.platformReviewUrl}
          hasReview={!!flow.review}
          accepted={!!flow.receipt}
        />
      </div>
    </>
  );
}

function InspectionPreview({
  columns,
  rows,
  rowCount,
  columnCount,
  version,
  warnings,
}: {
  columns: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  version: number;
  warnings: string[];
}) {
  return (
    <>
      <div className="portal-facts">
        <Fact label="Rows" value={rowCount} />
        <Fact label="Columns" value={columnCount} />
        <Fact label="Draft version" value={version} />
      </div>
      {warnings.length ? (
        <div className="portal-warnings">
          <h3>File inspection notes</h3>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="portal-preview-heading">
        <h3>Data preview</h3>
        <span>From the uploaded file</span>
      </div>
      <div className="portal-table-scroll">
        <table className="portal-table portal-preview">
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QualityPanel({
  ready,
  href,
  hasReview,
  accepted,
}: {
  ready: boolean;
  href: string;
  hasReview: boolean;
  accepted: boolean;
}) {
  return (
    <aside className="portal-qa-panel" aria-labelledby="qa-heading">
      <div className="portal-qa-brand">
        <span className="portal-qa-dot" aria-hidden="true" />
        Pokayoke<span>Quality review</span>
      </div>
      <div className="portal-qa-content">
        <span className="portal-kicker">Pre-submission gate</span>
        <h2 id="qa-heading">
          {accepted
            ? 'Reviewed and released.'
            : hasReview
              ? 'Review available.'
              : ready
                ? 'Ready for QA review.'
                : 'Preparing your file.'}
        </h2>
        <p>
          {accepted
            ? 'The backend has confirmed acceptance of this reviewed batch.'
            : hasReview
              ? 'Open Pokayoke to see the findings, resolve holds, and release your batch.'
              : ready
                ? 'Your file has been inspected. Confirm its profile in Pokayoke, then launch the quality checks.'
                : 'The file must finish inspection before the quality review can begin.'}
        </p>
        {ready && href ? (
          <a className="portal-button portal-button--qa" href={href}>
            Open in Pokayoke <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        {ready && !href ? (
          <p>
            Quality review is unavailable right now. Please contact your workspace administrator.
          </p>
        ) : null}
        <p className="portal-qa-footnote">
          {accepted
            ? 'Only the accepted snapshot is saved.'
            : 'Your figures stay outside the database until the reviewed batch is released.'}
        </p>
      </div>
    </aside>
  );
}

function MissingPage() {
  return (
    <>
      <PageHeading
        eyebrow="Page not found"
        title="This page is unavailable"
        description="Return to your company financials to continue."
      />
      <Link className="portal-button portal-button--primary" to="/">
        Company financials
      </Link>
    </>
  );
}
