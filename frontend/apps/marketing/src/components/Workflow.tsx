import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { workflowPhases } from '../content';

type Phase = (typeof workflowPhases)[number];

const presenterRoles = [
  ['Parse and preserve CSV.', 'Profile blanks and types.', 'Defer unclear meaning.'],
  ['Save a validated profile.', 'Check analysis eligibility.', 'Clarify and plan checks.'],
  ['Run approved checks.', 'Compare history and outliers.', 'Call tools; track results.'],
  ['Verify evidence and holds.', 'Add relevant comparisons.', 'Investigate explanations.'],
  ['Version edits; recheck.', 'Rerun affected analyses.', 'Reassess new context.'],
  ['Enforce gate; record release.', 'No prediction required.', 'Cannot waive the gate.'],
] as const;

export function Workflow() {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  return (
    <div ref={track} className={`workflow-sequence${reduced ? ' workflow-static' : ''}`}>
      <div className="workflow-viewport">
        <p className="section-context">The workflow</p>
        <h2 id="workflow-heading">
          Six phases.
          <br />
          One accountable journey.
        </h2>
        <p className="workflow-intro">
          Ordinary code for certainty. Statistics for signals. An agent for context.
        </p>
        <div className="workflow-stage">
          {workflowPhases.map((phase, index) => (
            <PhasePanel key={phase.id} phase={phase} index={index} progress={scrollYProgress} />
          ))}
        </div>
        <p className="workflow-scroll-hint">Scroll through the six phases</p>
      </div>
    </div>
  );
}

function PhasePanel({
  phase,
  index,
  progress,
}: {
  phase: Phase;
  index: number;
  progress: MotionValue<number>;
}) {
  const compact = presenterRoles[index];
  const start = index / 6;
  const end = (index + 1) / 6;
  const opacity = useTransform(
    progress,
    [Math.max(0, start - 0.025), start, end - 0.025, end],
    index === 0 ? [1, 1, 1, 0] : index === 5 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const y = useTransform(progress, [Math.max(0, start - 0.025), start, end], [12, 0, 0]);
  const transform = useTransform(() => `translate3d(0, ${y.get()}px, 0)`);
  return (
    <motion.article
      className="workflow-phase"
      style={{ opacity, transform }}
      aria-label={`Phase ${index + 1}: ${phase.title}`}
    >
      <div className="phase-title">
        <span className="phase-number">0{index + 1}</span>
        <h3>{phase.title}</h3>
      </div>
      <p className="phase-description">{phase.description}</p>
      <dl className="phase-roles">
        <div>
          <dt>Code</dt>
          <dd>
            <span className="phase-detail">{phase.code}</span>
            <span className="phase-presenter">{compact[0]}</span>
          </dd>
        </div>
        <div>
          <dt>Statistics</dt>
          <dd>
            <span className="phase-detail">{phase.statistics}</span>
            <span className="phase-presenter">{compact[1]}</span>
          </dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>
            <span className="phase-detail">{phase.agent}</span>
            <span className="phase-presenter">{compact[2]}</span>
          </dd>
        </div>
      </dl>
    </motion.article>
  );
}
