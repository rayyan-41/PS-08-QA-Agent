/**
 * HAND-WRITTEN API TYPES.
 *
 * Written from docs/api.md on 20 October 2026 because the backend's /openapi.json
 * was unreachable. It follows the shape openapi-typescript generates (`paths`,
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
  /** Shape not documented; rendered as text or JSON. */
  warnings: unknown[];
  [extra: string]: unknown;
}

export interface InspectResult {
  draft_id: string;
  version: number;
  inspection: Inspection;
}

/** GET /api/drafts/{id}. Note: this route returns `id`, not `draft_id`. */
export interface Draft {
  id: string;
  version: number;
  /** Values seen in docs: "uploaded", "inspected". Full set undocumented. */
  status: string;
  inspection?: Inspection | null;
  [extra: string]: unknown;
}

export interface RecommendedProfile {
  name: string;
  required_fields: string[];
  unique_fields: string[];
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
  planner_status: string;
  planner_note?: string | null;
  /** Shape not documented. */
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
  [extra: string]: unknown;
}

export interface Outcome {
  model: string;
  status: string;
  [extra: string]: unknown;
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
  /** Shape not documented. */
  activity: unknown[];
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
