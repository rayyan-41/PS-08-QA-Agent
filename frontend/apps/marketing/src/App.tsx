import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  ExternalLink,
  LockKeyhole,
  Monitor,
  OctagonPause,
  X,
} from 'lucide-react';
import { Logo } from '@pokayoke/ui';
import type { ReactNode } from 'react';
import type { AppConfig } from './config';
import { sectionIds, sources } from './content';
import { usePresenter } from './hooks/usePresenter';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { DataSpine } from './components/DataSpine';
import { Workflow } from './components/Workflow';
import { Architecture } from './components/Architecture';

export function App({ config }: { config: AppConfig }) {
  const presenter = usePresenter(sectionIds);
  useSmoothScroll(presenter.presenting);
  return (
    <div
      className={`marketing-page${presenter.presenting ? ' is-presenting' : ''}`}
      data-presenting={presenter.presenting}
    >
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <Header demoUrl={config.portalUrl} />
      <main id="main-content" className="marketing-main">
        <div className="marketing-story">
          <Section id="hero" active={presenter.activeIndex === 0}>
            <Hero />
          </Section>
          <Section id="problem" active={presenter.activeIndex === 1}>
            <Problem />
          </Section>
          <Section id="why-rules" active={presenter.activeIndex === 2}>
            <WhyRules />
          </Section>
          <Section id="poka-yoke" active={presenter.activeIndex === 3}>
            <PokaYoke />
          </Section>
          <Section id="workflow" active={presenter.activeIndex === 4}>
            <Workflow />
          </Section>
          <Section id="ninjas" active={presenter.activeIndex === 5}>
            <Ninjas />
          </Section>
          <Section id="trust" active={presenter.activeIndex === 6}>
            <Trust />
          </Section>
          <Section id="roadmap" active={presenter.activeIndex === 7}>
            <Roadmap />
          </Section>
          <Section id="demo" active={presenter.activeIndex === 8}>
            <Demo demoUrl={config.portalUrl} />
          </Section>
        </div>
        <DataSpine presenting={presenter.presenting} />
      </main>
      <Footer presenting={presenter.presenting} onPresent={presenter.toggle} />
      {presenter.presenting ? (
        <PresenterControls
          activeIndex={presenter.activeIndex}
          onGoTo={presenter.goTo}
          onExit={presenter.toggle}
        />
      ) : null}
    </div>
  );
}

function Section({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  return (
    <section
      id={id}
      className={`marketing-section section-${id}`}
      data-active={active}
      aria-labelledby={`${id}-heading`}
    >
      {children}
    </section>
  );
}

function Header({ demoUrl }: { demoUrl?: string }) {
  return (
    <header className="marketing-header">
      <a className="logo-link" href="#hero" aria-label="Pokayoke home">
        <Logo />
      </a>
      <nav aria-label="Main navigation">
        <a href="#problem">The problem</a>
        <a href="#workflow">How it works</a>
        <a href="#trust">Trust</a>
      </nav>
      <a className="marketing-button button-small" href={demoUrl || '#demo'}>
        Begin demo
      </a>
    </header>
  );
}

function Hero() {
  return (
    <div className="hero-content">
      <p className="section-context">A quality gate before the database</p>
      <h1 id="hero-heading">Catch the wrong number before it is saved.</h1>
      <p className="marketing-lead">
        A pre-submission QA layer for company financials. Check the context, show the evidence, and
        give analysts a clear decision before data is accepted.
      </p>
      <a className="marketing-button" href="#problem">
        See how it works <ArrowDown size={18} aria-hidden="true" />
      </a>
      <div className="hero-note">
        <span className="small-rule" />
        <p>
          Built for the moment between
          <br />
          data entry and database.
        </p>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <>
      <p className="section-context">The problem</p>
      <h2 id="problem-heading">
        The hardest errors
        <br />
        look like valid data.
      </h2>
      <p className="section-lead">
        A number can be correctly formatted, sit inside its permitted range, and still be the wrong
        number.
      </p>
      <div className="fact-stack">
        <article className="source-fact">
          <div className="fact-number">
            155,000<span>+</span>
          </div>
          <div>
            <h3>Automated checks. Errors still escape.</h3>
            <p>
              S&amp;P Global’s 2021 Quality Program snapshot describes more than 155,000 automated
              checks and a $50 reward for each client-reported issue it validates.
            </p>
            <a className="source-link" href={sources.spQuality} target="_blank" rel="noreferrer">
              S&amp;P Global · Quality Program, 2021 <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </article>
        <article className="source-fact">
          <div className="fact-number">
            ~1<span>%</span>
          </div>
          <div>
            <h3>Single-entry errors can pass range checks.</h3>
            <p>
              Barchard and Pace found an error rate around 1% for single manual entry. Most errors
              fell within allowable ranges.
            </p>
            <a className="source-link" href={sources.entryStudy} target="_blank" rel="noreferrer">
              Barchard &amp; Pace, 2011 <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </article>
      </div>
      <p className="section-footnote">
        Published research provides context. These are not Pokayoke performance claims.
      </p>
    </>
  );
}

function Status({ kind, children }: { kind: 'pass' | 'hold' | 'ask'; children: ReactNode }) {
  const Icon = kind === 'pass' ? Check : kind === 'hold' ? OctagonPause : CircleHelp;
  return (
    <span className={`example-status status-${kind}`}>
      <Icon size={15} aria-hidden="true" />
      {children}
    </span>
  );
}

function WhyRules() {
  return (
    <>
      <p className="section-context">Why rules miss it</p>
      <h2 id="why-rules-heading">
        In range.
        <br />
        Out of context.
      </h2>
      <p className="section-lead">The same entry. Two very different questions.</p>
      <div className="comparison" aria-label="Illustrative revenue comparison">
        <article className="comparison-row">
          <div className="comparison-label">A static rule asks</div>
          <h3>“Is this an allowed number?”</h3>
          <div className="example-value">
            Revenue (TTM) <strong>100 million</strong>
          </div>
          <p>Permitted range: 0–500 million.</p>
          <Status kind="pass">Range check passes</Status>
        </article>
        <article className="comparison-row context-check">
          <div className="comparison-label">Pokayoke asks</div>
          <h3>“Does it fit what we know?”</h3>
          <div className="example-value">
            Revenue (TTM) <strong className="red-pen">100 million</strong>
          </div>
          <p>
            The previous value was 10 million. A tenfold change needs supporting evidence,
            related-field checks and historical context.
          </p>
          <Status kind="ask">Verify against the source report</Status>
        </article>
      </div>
      <p className="section-footnote">
        Illustrative scenario. An unusual value is a reason to investigate, not proof of an error.
      </p>
    </>
  );
}

function PokaYoke() {
  return (
    <>
      <p className="section-context">The idea behind the name</p>
      <h2 id="poka-yoke-heading">
        Make the process
        <br />
        catch the mistake.
      </h2>
      <div className="name-definition">
        <span>poka-yoke</span>
        <p>
          Japanese: mistake-proofing
          <br />
          <span className="pronunciation">POH-kah YOH-keh</span>
        </p>
      </div>
      <p className="section-lead">
        Shigeo Shingo formalised poka-yoke in the Toyota Production System: build protection into
        the process, at the point a mistake can happen.
      </p>
      <div className="principle-list">
        <article>
          <CircleHelp size={24} aria-hidden="true" />
          <div>
            <h3>Warning: show the risk.</h3>
            <p>
              Evidence-backed findings ask the analyst to verify a questionable entry before
              submission.
            </p>
          </div>
        </article>
        <article>
          <LockKeyhole size={24} aria-hidden="true" />
          <div>
            <h3>Control: enforce the gate.</h3>
            <p>Unresolved holds prevent the batch from reaching the accepted destination.</p>
          </div>
        </article>
      </div>
    </>
  );
}

function Ninjas() {
  return (
    <>
      <p className="section-context">The ninjas</p>
      <h2 id="ninjas-heading">
        One planner.
        <br />
        The right tools.
      </h2>
      <p className="section-lead">
        The agent reasons about context and calls tools. Deterministic code validates the plan,
        verifies the evidence, and enforces the release conditions.
      </p>
      <Architecture />
      <p className="architecture-note">Planned architecture · backend integration in progress</p>
    </>
  );
}

const trustItems = [
  [
    'Evidence before verdict',
    'Each finding is designed to name the record, field, entered value, evidence, severity and linked procedure.',
  ],
  [
    'People approve the important actions',
    'The QA expert launches the run, approves corrections, and explicitly releases the reviewed batch.',
  ],
  [
    'A trace you can follow',
    'The audit trail records tool results, analyst decisions, draft versions and the final release receipt.',
  ],
  [
    'A gate that code enforces',
    'Held records stay out. Unresolved required checks cannot be waived by an agent’s explanation.',
  ],
  [
    'Secrets stay on the backend',
    'Model keys and service credentials belong on the server, outside browser code.',
  ],
] as const;

function Trust() {
  return (
    <>
      <p className="section-context">Trust by design</p>
      <h2 id="trust-heading">
        A finding needs a reason.
        <br />A release needs approval.
      </h2>
      <p className="section-lead">These are the safeguards the workflow is built around.</p>
      <dl className="trust-list">
        {trustItems.map(([title, description]) => (
          <div key={title}>
            <dt>
              <Check size={17} aria-hidden="true" />
              {title}
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

const roadmapItems = [
  [
    'Automatic pass',
    'Let clean records through when the approved checks and release conditions are satisfied.',
  ],
  [
    'Authorised auto-fixes',
    'Apply only corrections the workspace explicitly permits, with an explanation and a record of the change.',
  ],
  [
    'Measured autonomy',
    'Expand automation as reviewed evidence demonstrates precision. Keep uncertain cases with an analyst.',
  ],
  ['Live intake', 'Extend the same quality gate to ongoing entries through the widget and API.'],
] as const;

function Roadmap() {
  return (
    <>
      <p className="section-context">Roadmap</p>
      <h2 id="roadmap-heading">
        Earn trust.
        <br />
        Then earn autonomy.
      </h2>
      <p className="section-lead">
        Start with a reviewed batch. Grow toward an automated QA layer in front of the client
        database.
      </p>
      <ol className="roadmap-list">
        {roadmapItems.map(([title, description]) => (
          <li key={title}>
            <span className="roadmap-point" aria-hidden="true" />
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="section-footnote">
        Future direction. These capabilities are not presented as available in the current demo.
      </p>
    </>
  );
}

function Demo({ demoUrl }: { demoUrl?: string }) {
  return (
    <>
      <p className="section-context">From explanation to workflow</p>
      <h2 id="demo-heading">
        Let’s follow a batch
        <br />
        to the gate.
      </h2>
      <p className="section-lead">
        Start in Halden Research, a fictional financial data provider. Follow the planned journey
        from CSV intake to profile review, agent checks, analyst decisions and release.
      </p>
      <ol className="demo-journey">
        <li>Import company financials</li>
        <li>Review in Pokayoke</li>
        <li>Release the reviewed batch</li>
      </ol>
      <a
        className="marketing-button"
        href={demoUrl || '#demo'}
        aria-describedby={!demoUrl ? 'demo-availability' : undefined}
      >
        Begin demo
      </a>
      {!demoUrl ? (
        <p id="demo-availability" className="demo-availability">
          The live demo link will be available here when the client portal is deployed.
        </p>
      ) : null}
      <p className="demo-caption">
        Halden Research is a fictional company used to demonstrate Pokayoke.
      </p>
    </>
  );
}

function Footer({ presenting, onPresent }: { presenting: boolean; onPresent: () => void }) {
  return (
    <footer className="marketing-footer">
      <div>
        <a className="logo-link" href="#hero" aria-label="Pokayoke home">
          <Logo />
        </a>
        <p>
          Built at the atomcamp National AI Hackathon
          <br />
          20 October 2026 · NIC Islamabad
        </p>
      </div>
      <div className="footer-team">
        <p>Ibtasaam · Rayyan · Abdullah</p>
        <a href="https://github.com/rayyan-41/PS-08-QA-Agent" target="_blank" rel="noreferrer">
          View on GitHub <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <button
        className="presenter-toggle"
        type="button"
        onClick={onPresent}
        aria-pressed={presenting}
      >
        <Monitor size={17} aria-hidden="true" />
        Presenter mode <kbd>P</kbd>
      </button>
    </footer>
  );
}

function PresenterControls({
  activeIndex,
  onGoTo,
  onExit,
}: {
  activeIndex: number;
  onGoTo: (index: number) => void;
  onExit: () => void;
}) {
  return (
    <nav className="presenter-controls" aria-label="Presentation controls">
      <button type="button" onClick={() => onGoTo(activeIndex - 1)} aria-label="Previous section">
        <ArrowLeft size={19} />
      </button>
      <span aria-live="polite">
        {activeIndex + 1} of {sectionIds.length}
      </span>
      <button type="button" onClick={() => onGoTo(activeIndex + 1)} aria-label="Next section">
        <ArrowRight size={19} />
      </button>
      <span className="presenter-controls-divider" />
      <button type="button" onClick={onExit} aria-label="Exit presenter mode">
        <X size={19} />
      </button>
    </nav>
  );
}
