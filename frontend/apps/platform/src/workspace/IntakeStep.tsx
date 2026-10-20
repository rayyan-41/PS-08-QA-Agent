import { useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { Draft, Inspection } from '@pokayoke/api-client';
import { ActivityItem, Empty } from '../components/states';

/** Phase 1 output: how the backend read the file. */
export function IntakeStep({ draft }: { draft: Draft }) {
  const inspection = draft.inspection;
  if (!inspection) {
    return (
      <Empty title="Not inspected yet">
        <p>
          The file is stored (status <code>{draft.status}</code>) but has no inspection result.
          Start a new job or retry inspection from the New job page.
        </p>
      </Empty>
    );
  }
  return (
    <div className="stack-lg">
      <dl className="facts facts--inline">
        <dt>Rows</dt>
        <dd className="mono">{inspection.row_count}</dd>
        <dt>Columns</dt>
        <dd className="mono">{inspection.column_count}</dd>
        <dt>Preview rows</dt>
        <dd className="mono">{inspection.preview.length}</dd>
        <dt>Warnings</dt>
        <dd className="mono">{inspection.warnings.length}</dd>
      </dl>

      <section className="stack">
        <h2 className="h3">Warnings</h2>
        {inspection.warnings.length === 0 ? (
          <p className="muted">The backend reported no structural warnings.</p>
        ) : (
          <ul className="list">
            {inspection.warnings.map((warning, index) => (
              <li key={index}>
                <ActivityItem item={warning} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack">
        <h2 className="h3">Columns</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Column</th>
                <th scope="col">Candidate type</th>
                <th scope="col" className="num">
                  Blank
                </th>
                <th scope="col" className="num">
                  Distinct
                </th>
              </tr>
            </thead>
            <tbody>
              {inspection.columns.map((column) => (
                <tr key={column.name}>
                  <td className="mono">{column.name}</td>
                  <td>{column.candidate_type}</td>
                  <td className="num mono">{column.blank_count}</td>
                  <td className="num mono">{column.distinct_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details>
        <summary>Preview first {inspection.preview.length} rows (original text)</summary>
        <PreviewGrid inspection={inspection} />
      </details>
    </div>
  );
}

function PreviewGrid({ inspection }: { inspection: Inspection }) {
  const columns = useMemo<ColumnDef<Record<string, string | null>>[]>(() => {
    const names = inspection.columns.length
      ? inspection.columns.map((column) => column.name)
      : Object.keys(inspection.preview[0] ?? {});
    return names.map((name) => ({
      id: name,
      header: name,
      accessorFn: (row) => row[name],
      cell: (info) => {
        const value = info.getValue() as string | null | undefined;
        return value === '' || value === null || value === undefined ? (
          <span className="muted">(empty)</span>
        ) : (
          value
        );
      },
    }));
  }, [inspection]);
  const table = useReactTable({
    data: inspection.preview,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  if (inspection.preview.length === 0) return <p className="muted">The preview is empty.</p>;
  return (
    <div className="table-wrap table-wrap--grid">
      <table className="table table--grid">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              <th scope="col" className="num">
                #
              </th>
              {group.headers.map((header) => (
                <th key={header.id} scope="col" className="mono">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              <td className="num mono muted">{row.index + 1}</td>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="mono">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
