export const sectionIds = [
  'hero',
  'problem',
  'why-rules',
  'poka-yoke',
  'workflow',
  'ninjas',
  'trust',
  'roadmap',
  'demo',
] as const;

export const sources = {
  spQuality:
    'https://www.spglobal.com/marketintelligence/en/documents/234057_quality-program-snapshot_a4_digital.pdf',
  entryStudy: 'https://doi.org/10.1016/j.chb.2011.04.004',
  entryStudySummary: 'https://img.faculty.unlv.edu/lab/newsletter/issue3/data-checking/',
};

// Source: data/ps08_data_entries.csv, original entries 1, 4, and 6.
// These are illustrations of input values, not live findings or accepted batches.
export const sampleRecords = [
  {
    id: 'ENT-00001',
    entity: 'GlobalTech Inc',
    field: 'revenue_ttm',
    value: 31158.37,
    previous: 35342.91,
    min: -57.41,
    max: 25161.04,
  },
  {
    id: 'ENT-00004',
    entity: 'Vertex Energy',
    field: 'net_income',
    value: 29082.1,
    previous: 12920.59,
    min: -77.86,
    max: 49039.03,
  },
  {
    id: 'ENT-00006',
    entity: 'Atlas Mining',
    field: 'market_cap',
    value: 28453.92,
    previous: 40564.61,
    min: -47.72,
    max: 94617.73,
  },
] as const;

export const workflowPhases = [
  {
    id: 'receive',
    title: 'Receive and inspect',
    description:
      'Start with the file as it was entered. Preserve the original and inspect every row.',
    code: 'Parse CSV, preserve source values, profile columns.',
    statistics: 'Count blanks and identify candidate types.',
    agent: 'No model needed. Unclear meaning moves to the next phase.',
  },
  {
    id: 'understand',
    title: 'Understand and configure',
    description:
      'Ask what the file cannot tell us. Confirm units, requirements, and a reusable review profile.',
    code: 'Validate settings and save the versioned profile.',
    statistics: 'Check which analyses have enough context.',
    agent: 'Ask targeted questions and propose supported checks.',
  },
  {
    id: 'execute',
    title: 'Execute checks',
    description: 'Run the approved plan against the draft and the evidence available for it.',
    code: 'Check ranges, formats, duplicates, and relationships.',
    statistics: 'Compare history, outliers, and eligible forecasts.',
    agent: 'Call MCP tools and track actual completion.',
  },
  {
    id: 'investigate',
    title: 'Investigate and explain',
    description:
      'Bring related signals together. Explain what the evidence supports and what still needs verification.',
    code: 'Validate evidence references and holding conditions.',
    statistics: 'Provide additional comparisons when needed.',
    agent: 'Consult procedures and investigate alternative explanations.',
  },
  {
    id: 'resolve',
    title: 'Review and resolve',
    description:
      'An analyst previews a supported correction, approves the change, and rechecks the affected records.',
    code: 'Version edits, record decisions, and trigger rechecks.',
    statistics: 'Rerun affected analyses without automatic retraining.',
    agent: 'Reassess new context when interpretation is needed.',
  },
  {
    id: 'release',
    title: 'Release and record',
    description: 'Release the whole reviewed batch only when its holding issues are resolved.',
    code: 'Enforce the gate and record the exact accepted version once.',
    statistics: 'No prediction needed to publish an approved batch.',
    agent: 'Cannot waive the gate. Feedback can inform later advisory ranking.',
  },
] as const;
