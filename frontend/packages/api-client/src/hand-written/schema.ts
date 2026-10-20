/**
 * HAND-WRITTEN API TYPES.
 *
 * Written from docs/api.md and checked against backend/app.py (merged 20 October
 * 2026). The live /openapi.json types request bodies only: the routes return plain
 * dicts, so every response there is `unknown`. `../generated/schema.d.ts` is kept
 * for request-body reference. It follows the shape openapi-typescript generates (`paths`,
 * `components`) so `src/schema.ts` can switch to `src/generated/schema.d.ts`
 * without changing callers.
 *
 * Where docs/api.md shows `...` or omits a shape, the field is typed loosely
 * (optional or `unknown`) and the UI renders it defensively. Do not tighten a
 * type here without evidence from the backend. Regenerate with
 * `pnpm api:generate` once the backend runs, then delete this file.
 */

/** FastAPI's validation error item (HTTP 422). */
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/** FastAPI error body. `detail` is a string, or a list of items on 422. */
export interface ErrorBody {
  detail: string | ValidationErrorItem[];
}

export interface Health {
  status: string;
  /** "local" or "cloud" per docs/api.md; kept as string. */
  storage: string;
}

export interface DraftCreated {
  draft_id: string;
  version: number;
  status: string;
}

export interface ColumnSummary {
  name: string;
  candidate_type: string;
  blank_count: number;
  distinct_count: number;
  [extra: string]: unknown;
}

export interface Inspection {
  row_count: number;
  column_count: number;
  columns: ColumnSummary[];
  /** First rows, values kept as the original text. */
  preview: Record<string, string | null>[];
  /** Plain sentences, e.g. "x contains mixed numeric and text values". */
  warnings: string[];
  [extra: string]: unknown;
}

export interface InspectResult {
  draft_id: string;
  version: number;
  inspection: Inspection;
}

/** A recorded decision, or a correction history entry (both live in `draft.decisions`). */
export interface DraftHistoryEntry {
  finding_id?: string;
  decision?: string;
  reason?: string;
  evidence?: string;
  review_id?: string;
  at?: string;
  row?: number;
  field?: string;
  before?: string;
  after?: string;
  version?: number;
  [extra: string]: unknown;
}

/** GET /api/drafts/{id}. Note: this route returns `id`, not `draft_id`. */
export interface Draft {
  id: string;
  filename?: string;
  version: number;
  /** uploaded → inspected → configured → held | ready (backend/app.py). */
  status: string;
  created_at?: string;
  inspection?: Inspection | null;
  profile_id?: string;
  /** Pointer to the current review; removed when a correction creates a new version. */
  review?: { id: string; holds: number; version: number } | null;
  decisions?: DraftHistoryEntry[];
  [extra: string]: unknown;
}

export interface RecommendedProfile {
  name: string;
  required_fields: string[];
  unique_fields: string[];
  require_supporting_doc?: boolean;
  hold_suspicions?: boolean;
  checks: string[];
  [extra: string]: unknown;
}

export interface PlanQuestion {
  field: string;
  label: string;
  suggested?: string | null;
  [extra: string]: unknown;
}

export interface Plan {
  draft_id: string;
  version: number;
  recommended_profile: RecommendedProfile;
  questions: PlanQuestion[];
  available_checks: string[];
  /** completed | incomplete | failed | unavailable (agent run status, not the recommendation's source). */
  planner_status: string;
  planner_note?: string | null;
  /** Agent tool calls: {step, status: "called" | "observed"}. */
  planner_activity?: unknown[] | null;
  planner_error?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  version: number;
  checks: string[];
  required_fields?: string[];
  unique_fields?: string[];
  require_supporting_doc?: boolean;
  hold_suspicions?: boolean;
  answers?: Record<string, string>;
  reference_id?: string | null;
  required_checks?: string[];
  max_age_days?: number | null;
  reused_from?: string | null;
  [extra: string]: unknown;
}

export interface Reference {
  id: string;
  key: string;
  filename: string;
  row_count: number;
  columns: string[];
  digest: string;
  labels_verified: boolean;
  role: string;
}

export interface ProfileApproval {
  draft_version: number;
  name: string;
  required_fields: string[];
  unique_fields: string[];
  checks: string[];
  answers: Record<string, string>;
  reference_id?: string | null;
  required_checks?: string[];
  reuse_profile_id?: string | null;
  require_supporting_doc?: boolean;
  hold_suspicions?: boolean;
  max_age_days?: number | null;
  relationships?: { left: string; operator: string; right: string }[];
}

export interface ProfileApproved {
  profile: Profile;
  draft_id: string;
  version: number;
}

export interface Finding {
  id: string;
  row: number;
  field: string;
  code: string;
  severity: string;
  evidence_strength: string;
  evidence: string;
  action: string;
  proposed_value: string | null;
  hold: boolean;
  source: string;
  procedure?: string | null;
  draft_version: number;
  /** "analyst_verification" | "acknowledged" once a decision is recorded. */
  resolved_by?: string;
  /** Feedback: earlier verified-valid decisions for this check under the same profile. */
  prior_valid_verifications?: number;
  [extra: string]: unknown;
}

export interface Outcome {
  model: string;
  /** completed | ineligible | not_selected */
  status: string;
  reason?: string | null;
  group?: string;
  [extra: string]: unknown;
}

/** Result of the investigation agent's turn during POST /review. */
export interface AgentRun {
  status: string;
  reason?: string;
  note?: string;
  activity: unknown[];
}

export interface Review {
  id: string;
  draft_id: string;
  draft_version: number;
  profile_id: string;
  findings: Finding[];
  outcomes: Outcome[];
  total: number;
  holds: number;
  by_code: Record<string, number>;
  /** {step, status} items: deterministic/statistical steps, then agent tool calls. */
  activity: unknown[];
  agent?: AgentRun;
  created_at: string;
}

export interface CorrectionChange {
  row: number;
  field: string;
  value: string;
}

export interface CorrectionRequest {
  draft_version: number;
  changes: CorrectionChange[];
  reason: string;
}

export type DecisionKind = 'verified_valid' | 'acknowledge';

export interface DecisionRequest {
  draft_version: number;
  finding_id: string;
  decision: DecisionKind;
  reason: string;
  evidence?: string;
}

/** Response of corrections and decisions. */
export interface DraftReviewed {
  draft_id: string;
  version: number;
  review: Review;
}

export interface Receipt {
  id: string;
  draft_id: string;
  version: number;
  profile_id: string;
  review_id: string;
  row_count: number;
  digest: string;
  snapshot_key: string;
  accepted_at: string;
}

type Json<T> = { content: { 'application/json': T } };
type Errors = {
  404: Json<ErrorBody>;
  409: Json<ErrorBody>;
  413: Json<ErrorBody>;
  422: Json<ErrorBody>;
};
type Id = { parameters: { path: { id: string } } };
type Multipart = { content: { 'multipart/form-data': { file: Blob } } };

export interface components {
  schemas: {
    ErrorBody: ErrorBody;
    Health: Health;
    DraftCreated: DraftCreated;
    Inspection: Inspection;
    Draft: Draft;
    Plan: Plan;
    Profile: Profile;
    Reference: Reference;
    ProfileApproval: ProfileApproval;
    Review: Review;
    Finding: Finding;
    Receipt: Receipt;
  };
}

/** Route map in openapi-typescript's `paths` shape, for openapi-fetch. */
export interface paths {
  '/api/health': {
    get: { responses: { 200: Json<Health> } };
  };
  '/api/drafts': {
    post: { requestBody: Multipart; responses: { 200: Json<DraftCreated> } & Errors };
  };
  '/api/drafts/{id}': {
    get: Id & { responses: { 200: Json<Draft> } & Errors };
  };
  '/api/drafts/{id}/inspect': {
    post: Id & { responses: { 200: Json<InspectResult> } & Errors };
  };
  '/api/drafts/{id}/plan': {
    get: Id & { responses: { 200: Json<Plan> } & Errors };
  };
  '/api/profiles': {
    get: { responses: { 200: Json<Profile[]> } };
  };
  '/api/references': {
    post: { requestBody: Multipart; responses: { 200: Json<Reference> } & Errors };
  };
  '/api/drafts/{id}/profile': {
    post: Id & {
      requestBody: Json<ProfileApproval>;
      responses: { 200: Json<ProfileApproved> } & Errors;
    };
  };
  '/api/drafts/{id}/review': {
    get: Id & { responses: { 200: Json<Review> } & Errors };
    post: Id & { responses: { 200: Json<Review> } & Errors };
  };
  '/api/drafts/{id}/corrections': {
    post: Id & {
      requestBody: Json<CorrectionRequest>;
      responses: { 200: Json<DraftReviewed> } & Errors;
    };
  };
  '/api/drafts/{id}/decisions': {
    post: Id & {
      requestBody: Json<DecisionRequest>;
      responses: { 200: Json<DraftReviewed> } & Errors;
    };
  };
  '/api/drafts/{id}/submit': {
    post: Id & { responses: { 200: Json<Receipt> } & Errors };
  };
  '/api/accepted/{receipt}': {
    get: { parameters: { path: { receipt: string } }; responses: { 200: Json<Receipt> } & Errors };
  };
  '/api/accepted/{receipt}/download': {
    get: {
      parameters: { path: { receipt: string } };
      responses: { 200: { content: { 'text/csv': string } } } & Errors;
    };
  };
}
