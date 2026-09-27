export type VercelDeployment = {
  id: string;
  url: string | null;
  state: string;
  target: string | null;
  createdAt: Date;
  readyAt: Date | null;
  buildingAt: Date | null;
  source: string | null;
  meta: {
    gitCommitSha: string | null;
    gitCommitMessage: string | null;
    gitCommitAuthor: string | null;
    gitBranch: string | null;
  };
  inspectorUrl: string | null;
};

export type VercelStatus = {
  onVercel: boolean;
  env: string | null;
  targetEnv: string | null;
  region: string | null;
  deploymentId: string | null;
  url: string | null;
  branchUrl: string | null;
  productionUrl: string | null;
  projectId: string | null;
  teamId: string | null;
  gitProvider: string | null;
  gitRepo: string | null;
  gitBranch: string | null;
  gitCommitSha: string | null;
  gitCommitMessage: string | null;
  gitCommitAuthor: string | null;
  gitCommitAuthorName: string | null;
  nodeEnv: string | null;
  nextRuntime: string | null;
  skewProtection: boolean;
  dashboardUrl: string | null;
  apiConfigured: boolean;
  apiError: string | null;
  deployments: VercelDeployment[];
};

type VercelApiDeployment = {
  uid?: string;
  id?: string;
  url?: string | null;
  name?: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  createdAt?: number;
  buildingAt?: number;
  ready?: number;
  source?: string | null;
  inspectorUrl?: string | null;
  meta?: Record<string, string | undefined>;
};

function env(name: string) {
  return process.env[name]?.trim() || null;
}

function buildDashboardUrl(projectId: string | null, teamId: string | null) {
  if (!projectId) return null;
  const team = teamId ? `/${teamId}` : "";
  return `https://vercel.com${team}/${projectId}`;
}

export function getVercelEnvStatus(): Omit<
  VercelStatus,
  "apiConfigured" | "apiError" | "deployments"
> {
  const onVercel = process.env.VERCEL === "1";
  const projectId = env("VERCEL_PROJECT_ID");
  const teamId = env("VERCEL_TEAM_ID");
  const owner = env("VERCEL_GIT_REPO_OWNER");
  const slug = env("VERCEL_GIT_REPO_SLUG");

  return {
    onVercel,
    env: env("VERCEL_ENV"),
    targetEnv: env("VERCEL_TARGET_ENV"),
    region: env("VERCEL_REGION"),
    deploymentId: env("VERCEL_DEPLOYMENT_ID"),
    url: env("VERCEL_URL"),
    branchUrl: env("VERCEL_BRANCH_URL"),
    productionUrl: env("VERCEL_PROJECT_PRODUCTION_URL"),
    projectId,
    teamId,
    gitProvider: env("VERCEL_GIT_PROVIDER"),
    gitRepo: owner && slug ? `${owner}/${slug}` : null,
    gitBranch: env("VERCEL_GIT_COMMIT_REF"),
    gitCommitSha: env("VERCEL_GIT_COMMIT_SHA"),
    gitCommitMessage: env("VERCEL_GIT_COMMIT_MESSAGE"),
    gitCommitAuthor: env("VERCEL_GIT_COMMIT_AUTHOR_LOGIN"),
    gitCommitAuthorName: env("VERCEL_GIT_COMMIT_AUTHOR_NAME"),
    nodeEnv: env("NODE_ENV"),
    nextRuntime: env("NEXT_RUNTIME"),
    skewProtection: process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1",
    dashboardUrl: buildDashboardUrl(projectId, teamId),
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(onTimeout), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function mapDeployment(row: VercelApiDeployment): VercelDeployment {
  const id = row.uid ?? row.id ?? "unknown";
  const meta = row.meta ?? {};
  return {
    id,
    url: row.url ?? null,
    state: row.readyState ?? row.state ?? "UNKNOWN",
    target: row.target ?? null,
    createdAt: new Date(row.createdAt ?? Date.now()),
    readyAt: row.ready ? new Date(row.ready) : null,
    buildingAt: row.buildingAt ? new Date(row.buildingAt) : null,
    source: row.source ?? null,
    meta: {
      gitCommitSha: meta.githubCommitSha ?? meta.gitlabCommitSha ?? meta.bitbucketCommitSha ?? null,
      gitCommitMessage:
        meta.githubCommitMessage ??
        meta.gitlabCommitMessage ??
        meta.bitbucketCommitMessage ??
        null,
      gitCommitAuthor:
        meta.githubCommitAuthorLogin ??
        meta.gitlabCommitAuthorLogin ??
        meta.bitbucketCommitAuthorLogin ??
        null,
      gitBranch:
        meta.githubCommitRef ?? meta.gitlabCommitRef ?? meta.bitbucketCommitRef ?? null,
    },
    inspectorUrl:
      row.inspectorUrl ??
      (row.url ? `https://vercel.com/deployments/${id}` : null),
  };
}

/**
 * Optional live deployment history via Vercel REST API.
 * Requires VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN) + preferably VERCEL_PROJECT_ID.
 */
export async function getVercelStatus(): Promise<VercelStatus> {
  const base = getVercelEnvStatus();
  const token = env("VERCEL_TOKEN") ?? env("VERCEL_ACCESS_TOKEN");

  if (!token) {
    return {
      ...base,
      apiConfigured: false,
      apiError: null,
      deployments: [],
    };
  }

  try {
    const params = new URLSearchParams({ limit: "8" });
    if (base.projectId) params.set("projectId", base.projectId);
    if (base.teamId) params.set("teamId", base.teamId);
    if (!base.projectId && base.gitRepo) {
      const app = base.gitRepo.split("/")[1];
      if (app) params.set("app", app);
    }

    const result = await withTimeout(
      fetch(`https://api.vercel.com/v7/deployments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Vercel API ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
        }
        return res.json() as Promise<{ deployments?: VercelApiDeployment[] }>;
      }),
      8_000,
      null,
    );

    if (!result) {
      return {
        ...base,
        apiConfigured: true,
        apiError: "Timed out fetching Vercel deployments",
        deployments: [],
      };
    }

    return {
      ...base,
      apiConfigured: true,
      apiError: null,
      deployments: (result.deployments ?? []).map(mapDeployment),
    };
  } catch (error) {
    return {
      ...base,
      apiConfigured: true,
      apiError: error instanceof Error ? error.message : "Vercel API error",
      deployments: [],
    };
  }
}
