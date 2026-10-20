// Query keys include the backend target so switching targets never mixes data.
export const keys = {
  health: (t: string) => ['health', t] as const,
  draft: (t: string, id: string) => ['draft', t, id] as const,
  plan: (t: string, id: string) => ['plan', t, id] as const,
  review: (t: string, id: string) => ['review', t, id] as const,
  profiles: (t: string) => ['profiles', t] as const,
  receipt: (t: string, r: string) => ['receipt', t, r] as const,
  job: (t: string, id: string) => ['job', t, id] as const,
};
