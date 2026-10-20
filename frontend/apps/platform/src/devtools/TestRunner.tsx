import { useState } from 'react';
import { FlaskConical } from '@pokayoke/ui';
import type { Review } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import type { Backend } from '../api/backend';
import { isApiError } from '../api/errors';

/**
 * Backend tests run from the browser against the active target. Every call is
 * real and appears in the request log. "Inconclusive" means the precondition
 * for the test could not be set up, not that the backend passed or failed.
 */
type Verdict = 'pass' | 'fail' | 'inconclusive';
interface TestResult {
  verdict: Verdict;
  actual: string;
}
interface Shared {
  journeyDraftId?: string;
  journeyVersion?: number;
  journeyReview?: Review;
}
interface TestCase {
  name: string;
  expected: string;
  run: (backend: Backend, shared: Shared) => Promise<TestResult>;
}

function outcome(error: unknown): string {
  if (isApiError(error)) {
    return error.status
      ? `HTTP ${error.status}: ${error.detail}`
      : `No response (${error.kind}): ${error.detail}`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function sampleFile(): Promise<File> {
  const response = await fetch('/test-assets/ps08_data_entries.csv', { cache: 'no-store' });
  if (!response.ok)
    throw new Error(`Sample CSV missing from the console build (HTTP ${response.status}).`);
  return new File([await response.blob()], 'ps08_data_entries.csv', { type: 'text/csv' });
}

/** Upload, inspect, plan, approve the recommendation, review. Returns the review. */
async function prepareReviewed(backend: Backend, file: File, checksOverride?: string[]) {
  const created = await backend.createDraft(file);
  await backend.inspect(created.draft_id);
  const plan = await backend.plan(created.draft_id);
  const draft = await backend.draft(created.draft_id);
  const rec = plan.recommended_profile;
  await backend.approveProfile(created.draft_id, {
    draft_version: draft.version,
    name: `Test ${rec.name}`,
    required_fields: checksOverride ? [] : rec.required_fields,
    unique_fields: checksOverride ? [] : rec.unique_fields,
    checks: checksOverride ?? rec.checks,
    answers: Object.fromEntries(plan.questions.map((q) => [q.field, q.suggested ?? 'Test answer'])),
    required_checks: [],
  });
  const review = await backend.runReview(created.draft_id);
  const after = await backend.draft(created.draft_id);
  return { draftId: created.draft_id, version: after.version, review };
}

const TESTS: TestCase[] = [
  {
    name: '1. Full journey',
    expected:
      'Upload sample CSV, inspect, plan, approve, review all succeed; submit returns 409 while holds remain (or a receipt if none).',
    run: async (backend, shared) => {
      const { draftId, version, review } = await prepareReviewed(backend, await sampleFile());
      shared.journeyDraftId = draftId;
      shared.journeyVersion = version;
      shared.journeyReview = review;
      try {
        const receipt = await backend.submit(draftId);
        return review.holds > 0
          ? {
              verdict: 'fail',
              actual: `Released with ${review.holds} holds: receipt ${receipt.id}`,
            }
          : { verdict: 'pass', actual: `No holds; released as receipt ${receipt.id}` };
      } catch (error) {
        if (isApiError(error) && error.status === 409 && review.holds > 0) {
          return {
            verdict: 'pass',
            actual: `Job ${draftId}: ${review.holds} holds, submit → ${outcome(error)}`,
          };
        }
        return { verdict: 'fail', actual: `Job ${draftId}: submit → ${outcome(error)}` };
      }
    },
  },
  {
    name: '2. Stale version',
    expected: 'A decision sent with draft_version − 1 returns HTTP 409.',
    run: async (backend, shared) => {
      const finding = shared.journeyReview?.findings[0];
      if (!shared.journeyDraftId || shared.journeyVersion === undefined || !finding) {
        return {
          verdict: 'inconclusive',
          actual: 'Run test 1 first; it must produce at least one finding.',
        };
      }
      try {
        await backend.decide(shared.journeyDraftId, {
          draft_version: shared.journeyVersion - 1,
          finding_id: finding.id,
          decision: finding.hold ? 'verified_valid' : 'acknowledge',
          reason: 'Stale-version test',
          evidence: 'Automated console test',
        });
        return { verdict: 'fail', actual: 'Accepted (HTTP 200) with a stale version.' };
      } catch (error) {
        return {
          verdict: isApiError(error) && error.status === 409 ? 'pass' : 'fail',
          actual: outcome(error),
        };
      }
    },
  },
  {
    name: '3. Idempotent release',
    expected: 'Submitting a ready job twice returns the same receipt id both times.',
    run: async (backend) => {
      const csv = 'entry_id,value\nT1,10\nT2,11\nT3,12\n';
      const file = new File([csv], 'idempotency-test.csv', { type: 'text/csv' });
      const { draftId, review } = await prepareReviewed(backend, file, []);
      if (review.holds > 0) {
        return {
          verdict: 'inconclusive',
          actual: `Could not get a ready job: ${review.holds} holds on ${draftId}.`,
        };
      }
      const first = await backend.submit(draftId);
      const second = await backend.submit(draftId);
      return {
        verdict: first.id === second.id ? 'pass' : 'fail',
        actual: `First ${first.id}, second ${second.id}`,
      };
    },
  },
  {
    name: '4. Size limit',
    expected: 'Uploading a file over 10 MB returns HTTP 413.',
    run: async (backend) => {
      const line = 'E0000001,GlobalTech Inc,revenue_ttm,123456789.00,2026-01-01\n';
      const repeats = Math.ceil((10.5 * 1024 * 1024) / line.length);
      const file = new File(
        ['entry_id,entity,field,value,date\n', line.repeat(repeats)],
        'too-big.csv',
        {
          type: 'text/csv',
        },
      );
      try {
        const created = await backend.createDraft(file);
        return {
          verdict: 'fail',
          actual: `Accepted ${(file.size / 1048576).toFixed(1)} MB as ${created.draft_id}`,
        };
      } catch (error) {
        return {
          verdict: isApiError(error) && error.status === 413 ? 'pass' : 'fail',
          actual: outcome(error),
        };
      }
    },
  },
  {
    name: '5. Unknown ID',
    expected: 'GET a random job ID returns HTTP 404.',
    run: async (backend) => {
      const id = `console-test-${crypto.randomUUID()}`;
      try {
        await backend.draft(id);
        return { verdict: 'fail', actual: `HTTP 200 for ${id}` };
      } catch (error) {
        return {
          verdict: isApiError(error) && error.status === 404 ? 'pass' : 'fail',
          actual: outcome(error),
        };
      }
    },
  },
  {
    name: '6. Waiver refusal',
    expected: 'verified_valid on a confirmed required violation is refused (HTTP 4xx).',
    run: async (backend, shared) => {
      const finding = shared.journeyReview?.findings.find(
        (f) => f.hold && f.evidence_strength === 'confirmed',
      );
      if (!shared.journeyDraftId || shared.journeyVersion === undefined || !finding) {
        return {
          verdict: 'inconclusive',
          actual: 'Run test 1 first; it must produce a confirmed holding finding.',
        };
      }
      const current = await backend.draft(shared.journeyDraftId);
      try {
        await backend.decide(shared.journeyDraftId, {
          draft_version: current.version,
          finding_id: finding.id,
          decision: 'verified_valid',
          reason: 'Waiver refusal test',
          evidence: 'Automated console test',
        });
        return {
          verdict: 'fail',
          actual: `Waiver accepted for ${finding.code} on row ${finding.row}`,
        };
      } catch (error) {
        const refused =
          isApiError(error) &&
          error.status !== undefined &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 409;
        return { verdict: refused ? 'pass' : 'fail', actual: outcome(error) };
      }
    },
  },
];

export function TestRunner() {
  const { backend } = useBackend();
  const [shared] = useState<Shared>({});
  const [results, setResults] = useState<Record<string, TestResult | 'running'>>({});

  async function runOne(test: TestCase) {
    setResults((r) => ({ ...r, [test.name]: 'running' }));
    let result: TestResult;
    try {
      result = await test.run(backend, shared);
    } catch (error) {
      result = { verdict: 'fail', actual: `Setup failed: ${outcome(error)}` };
    }
    setResults((r) => ({ ...r, [test.name]: result }));
  }

  async function runAll() {
    for (const test of TESTS) await runOne(test);
  }

  return (
    <div className="stack">
      <p className="muted small">
        Real requests against the active target. They create jobs and may release a small test batch
        (test 3).
      </p>
      <button type="button" className="btn btn--primary btn--small" onClick={() => void runAll()}>
        <FlaskConical aria-hidden size={14} /> Run all tests
      </button>
      <ul className="tests">
        {TESTS.map((test) => {
          const result = results[test.name];
          return (
            <li
              key={test.name}
              className={result && result !== 'running' ? `is-${result.verdict}` : undefined}
            >
              <div className="row">
                <strong>{test.name}</strong>
                <span className="tests__verdict">
                  {result === 'running'
                    ? 'Running…'
                    : result
                      ? result.verdict.toUpperCase()
                      : 'Not run'}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => void runOne(test)}
                >
                  Run
                </button>
              </div>
              <p className="small">
                <span className="muted">Expected:</span> {test.expected}
              </p>
              {result && result !== 'running' ? (
                <p className="small mono">
                  <span className="muted">Actual:</span> {result.actual}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
