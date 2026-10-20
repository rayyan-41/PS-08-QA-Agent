export function Architecture() {
  return (
    <figure className="architecture-figure">
      <svg
        className="architecture-svg architecture-presenter"
        viewBox="0 0 1160 220"
        role="img"
        aria-labelledby="presenter-architecture-title presenter-architecture-description"
      >
        <title id="presenter-architecture-title">Planned agent architecture</title>
        <desc id="presenter-architecture-description">
          The QA expert launches one Google ADK ReAct planner. It calls MCP inspection, reference,
          check catalog and history tools. Code validates evidence, the analyst reviews corrections,
          and a code-enforced gate controls acceptance.
        </desc>
        <defs>
          <marker
            id="presenter-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
          </marker>
        </defs>
        <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#presenter-arrow)">
          <path d="M210 78 H238" />
          <path d="M448 78 H476" />
          <path d="M686 78 H714" />
          <path d="M924 78 H952" />
          <path d="M580 36 V12 H343 V36" />
        </g>
        <g className="architecture-node">
          <rect x="0" y="36" width="210" height="84" rx="6" />
          <text x="105" y="70">
            QA expert
          </text>
          <text x="105" y="100">
            Launch ninjas
          </text>
        </g>
        <g className="architecture-node architecture-planner">
          <rect x="238" y="36" width="210" height="84" rx="6" />
          <text x="343" y="70">
            One ADK ReAct agent
          </text>
          <text x="343" y="100">
            Reason · act · observe
          </text>
        </g>
        <g className="architecture-node">
          <rect x="476" y="36" width="210" height="84" rx="6" />
          <text x="581" y="70">
            MCP tools
          </text>
          <text x="581" y="100">
            Gather evidence
          </text>
        </g>
        <g className="architecture-node">
          <rect x="714" y="36" width="210" height="84" rx="6" />
          <text x="819" y="70">
            Validate evidence
          </text>
          <text x="819" y="100">
            Analyst reviews
          </text>
        </g>
        <g className="architecture-node">
          <rect x="952" y="36" width="208" height="84" rx="6" />
          <text x="1056" y="70">
            Code-enforced gate
          </text>
          <text x="1056" y="100">
            Accepted batch
          </text>
        </g>
        <text className="presenter-tool-legend" x="580" y="169">
          Tools: inspection · references · check catalog · history
        </text>
        <text className="presenter-tool-legend" x="580" y="204">
          People approve corrections and release. Unresolved holds block the batch.
        </text>
      </svg>
      <svg
        className="architecture-svg architecture-standard"
        viewBox="0 0 680 420"
        role="img"
        aria-labelledby="architecture-title architecture-description"
      >
        <title id="architecture-title">Planned Pokayoke agent architecture</title>
        <desc id="architecture-description">
          A QA expert approves the profile and presses Launch ninjas. One Google ADK ReAct planner
          calls inspection, reference, check catalog and history tools through MCP. Deterministic
          validation checks evidence. The analyst approves corrections and release. Code enforces
          the gate before the reviewed batch is accepted. Investigation can return to tools for more
          evidence.
        </desc>
        <defs>
          <marker
            id="architecture-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
          </marker>
        </defs>
        <g
          className="architecture-connectors"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          markerEnd="url(#architecture-arrow)"
        >
          <path d="M340 64 V96" />
          <path d="M340 168 V200" />
          <path d="M340 266 V300" />
          <path d="M440 132 H524 V186" />
          <path d="M524 249 V267 H445" />
          <path d="M340 354 V390" />
          <path d="M235 230 H150 V150 H230" />
        </g>
        <g className="architecture-node">
          <rect x="200" y="8" width="280" height="56" rx="6" />
          <text x="340" y="32">
            QA expert approves profile
          </text>
          <text className="architecture-subtext" x="340" y="51">
            Human action: Launch ninjas
          </text>
        </g>
        <g className="architecture-node architecture-planner">
          <rect x="200" y="96" width="280" height="72" rx="6" />
          <text x="340" y="124">
            One ReAct planning agent
          </text>
          <text className="architecture-subtext" x="340" y="148">
            Google ADK · reason, act, observe
          </text>
        </g>
        <g className="architecture-node">
          <rect x="445" y="186" width="215" height="63" rx="6" />
          <text x="552" y="211">
            MCP tools
          </text>
          <text className="architecture-subtext" x="552" y="232">
            Inspect · references · checks · history
          </text>
        </g>
        <g className="architecture-node">
          <rect x="200" y="200" width="235" height="66" rx="6" />
          <text x="317" y="226">
            Deterministic validation
          </text>
          <text className="architecture-subtext" x="317" y="247">
            Verify evidence and proposed actions
          </text>
        </g>
        <text className="architecture-loop-label" x="32" y="204">
          More evidence
        </text>
        <text className="architecture-loop-label" x="32" y="223">
          when needed
        </text>
        <g className="architecture-node">
          <rect x="200" y="300" width="280" height="54" rx="6" />
          <text x="340" y="322">
            Analyst reviews and resolves
          </text>
          <text className="architecture-subtext" x="340" y="341">
            Approve corrections · recheck · release
          </text>
        </g>
        <g className="architecture-output">
          <text x="340" y="411">
            Code-enforced gate → accepted batch
          </text>
        </g>
      </svg>
      <figcaption>
        Tools produce evidence. People approve actions. Code controls acceptance.
      </figcaption>
    </figure>
  );
}
