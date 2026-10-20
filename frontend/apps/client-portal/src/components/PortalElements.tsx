import { Link, NavLink } from 'react-router';
import type { ReactNode } from 'react';

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal-page">
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="portal-header">
        <Link className="portal-brand" to="/" aria-label="Halden Research home">
          <span className="portal-monogram" aria-hidden="true">
            HR
          </span>
          <span>
            Halden Research<small>Financial data operations</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            Company financials
          </NavLink>
          <NavLink to="/import">Import figures</NavLink>
        </nav>
        <span className="portal-workspace-label">Research workspace</span>
      </header>
      <main id="main-content" className="portal-main">
        {children}
      </main>
      <footer className="portal-footer">
        <span>Halden Research is a fictional company used to demonstrate Pokayoke.</span>
        <span>Financial data operations</span>
      </footer>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="portal-page-heading">
      <div>
        <span className="portal-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children ? <div className="portal-heading-actions">{children}</div> : null}
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="portal-status">
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div className="portal-error" role="alert">
      {children}
    </div>
  );
}

export function FilePicker({
  file,
  disabled,
  onSelect,
}: {
  file: File | null;
  disabled: boolean;
  onSelect: (file: File | null) => void;
}) {
  return (
    <label
      className="portal-file-picker"
      data-disabled={disabled}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (!disabled) onSelect(event.dataTransfer.files.item(0));
      }}
    >
      <input
        name="figures-file"
        aria-label="Company financials CSV"
        type="file"
        accept=".csv,text/csv"
        disabled={disabled}
        onChange={(event) => onSelect(event.target.files?.item(0) ?? null)}
      />
      <span className="portal-file-symbol" aria-hidden="true">
        CSV
      </span>
      <strong>{file ? 'Change your CSV file' : 'Choose a CSV or drop it here'}</strong>
      <span>
        {file
          ? 'Choose another file to replace this selection.'
          : 'Company financials, one entry per row.'}
      </span>
      <span className="portal-button portal-button--secondary" aria-hidden="true">
        {file ? 'Change file' : 'Choose file'}
      </span>
    </label>
  );
}
