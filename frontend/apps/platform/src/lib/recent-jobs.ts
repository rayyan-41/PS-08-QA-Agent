import { readJson, writeJson } from './storage';

/** A job (backend "draft") created from this browser. There is no list route yet. */
export interface RecentJob {
  id: string;
  filename: string;
  createdAt: string;
  /** Backend target the job was created on ("" = same origin). */
  target: string;
}

const KEY = 'pokayoke.recentJobs';

export function readRecentJobs(): RecentJob[] {
  const jobs = readJson<unknown>(KEY, []);
  return Array.isArray(jobs) ? (jobs as RecentJob[]) : [];
}

export function rememberJob(job: RecentJob) {
  const others = readRecentJobs().filter((item) => item.id !== job.id);
  writeJson(KEY, [job, ...others].slice(0, 50));
}

export function forgetJob(id: string) {
  writeJson(
    KEY,
    readRecentJobs().filter((item) => item.id !== id),
  );
}
