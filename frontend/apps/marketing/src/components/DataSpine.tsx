import { useRef } from 'react';
import {
  Check,
  FileSpreadsheet,
  ListChecks,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
} from 'lucide-react';
import { sampleRecords } from '../content';
import { useSpineAnimation } from '../hooks/useSpineAnimation';

const stations = [
  { y: 136, x: 152, label: 'Inspect' },
  { y: 212, x: 209, label: 'Configure' },
  { y: 288, x: 152, label: 'Check' },
  { y: 364, x: 209, label: 'Investigate' },
  { y: 440, x: 152, label: 'Resolve' },
  { y: 516, x: 209, label: 'Release' },
] as const;

const path =
  'M152 24 C52 55 60 98 152 136 S302 176 209 212 S60 252 152 288 S302 328 209 364 S60 404 152 440 S302 480 209 516 C142 545 160 573 202 592';

export function DataSpine({ presenting }: { presenting: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useSpineAnimation(ref, presenting);
  return (
    <aside className="data-spine" ref={ref} aria-label="Illustration with sample records">
      <div className="spine-sticky">
        <div className="spine-annotation">
          <span className="spine-annotation-line" />
          From entry to acceptance
        </div>
        <div className="spine-drawing">
          <svg viewBox="0 0 360 620" fill="none" aria-hidden="true" className="spine-svg">
            <path className="spine-underlay" d={path} />
            <path className="spine-flow" pathLength="1" d={path} />
            {stations.map((station, index) => (
              <g key={station.label} data-spine-station={index}>
                <circle cx={station.x} cy={station.y} r="5" className="spine-station" />
                <text x={station.x + 16} y={station.y + 4} className="spine-station-label">
                  {index + 1}. {station.label}
                </text>
              </g>
            ))}
          </svg>
          <div className="travelling-record spine-record" aria-hidden="true">
            <FileSpreadsheet size={12} /> {sampleRecords[0].id}
          </div>
          <SpinePopups />
          <p className="spine-static-note">
            Preserve the file. Confirm its profile. Check and explain the evidence. Approve
            supported corrections, recheck, then release only when every hold is resolved.
          </p>
          <div className="accepted-record">
            <Check size={15} aria-hidden="true" />
            <span>Accepted destination</span>
          </div>
        </div>
        <p className="spine-caption">Workflow illustration · sample CSV evidence</p>
      </div>
    </aside>
  );
}

function SpinePopups() {
  return (
    <div className="spine-popups">
      <article className="spine-popup" data-spine-popup="0" aria-hidden="true">
        <p className="spine-popup-title">
          <FileSpreadsheet size={15} /> Original file preserved
        </p>
        <p>Inspect columns and source values before making any changes.</p>
        <div className="spine-popup-record">
          <span>{sampleRecords[0].entity}</span>
          <strong>
            {sampleRecords[0].field}: {sampleRecords[0].value}
          </strong>
        </div>
      </article>
      <article className="spine-popup" data-spine-popup="1" aria-hidden="true">
        <p className="spine-popup-title">
          <SlidersHorizontal size={15} /> Confirm the review profile
        </p>
        <p>Agree on units, reporting periods, required documents, and the checks to run.</p>
        <span className="spine-popup-detail">Human approval before launch</span>
      </article>
      <article className="spine-popup" data-spine-popup="2" aria-hidden="true">
        <p className="spine-popup-title">
          <ListChecks size={15} /> A value needs verification
        </p>
        <div className="spine-popup-record">
          <span>
            {sampleRecords[0].entity} · {sampleRecords[0].field}
          </span>
          <strong className="red-pen">Entered: {sampleRecords[0].value}</strong>
        </div>
        <p>
          CSV range: {sampleRecords[0].min} to {sampleRecords[0].max}.
        </p>
      </article>
      <article className="spine-popup" data-spine-popup="3" aria-hidden="true">
        <p className="spine-popup-title">
          <Search size={15} /> Evidence before a verdict
        </p>
        <p>
          Previous value: <span className="spine-popup-value">{sampleRecords[0].previous}</span>.
          Compare the source and reporting period before proposing a correction.
        </p>
        <span className="spine-popup-detail">A prior value alone is not a replacement</span>
      </article>
      <article className="spine-popup" data-spine-popup="4" aria-hidden="true">
        <p className="spine-popup-title">
          <SquarePen size={15} /> Review, approve, recheck
        </p>
        <p>
          The analyst previews a supported correction. The system versions the edit and rechecks
          affected records.
        </p>
        <span className="spine-popup-detail">No silent edits</span>
      </article>
      <article className="spine-popup" data-spine-popup="5" aria-hidden="true">
        <p className="spine-popup-title">
          <ShieldCheck size={15} /> The release gate enforces
        </p>
        <p>
          Only a reviewed batch with every holding issue resolved can reach the accepted
          destination.
        </p>
        <span className="spine-popup-detail">The agent cannot waive a hold</span>
      </article>
    </div>
  );
}
