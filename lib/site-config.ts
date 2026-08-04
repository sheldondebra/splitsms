import raw from "@/config/site.json";

export type SiteConfig = typeof raw;

const config: SiteConfig = raw;

/** Production default from config/site.json (no env). */
export const defaultSiteUrl = config.siteUrl.replace(/\/$/, "");

/** Canonical public site URL. Never returns localhost in production builds. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (
    fromEnv &&
    !(
      process.env.NODE_ENV === "production" &&
      (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fromEnv) ||
        fromEnv.includes("localhost"))
    )
  ) {
    return fromEnv;
  }
  return defaultSiteUrl;
}

/** Public REST API base, e.g. https://www.splitsms.com/api/v1 */
export function getApiPublicBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return getApiV1Url();
}

export function getApiBaseUrl(): string {
  return getSiteUrl();
}

export function getApiV1Url(path = ""): string {
  const base = getApiBaseUrl();
  const prefix = config.apiPathPrefix.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${prefix}${p}`;
}

export const siteName = config.siteName;
export const supportEmail = config.supportEmail;

export const wordpressPlugin = {
  ...config.wordpressPlugin,
  get downloadUrl() {
    return `${getSiteUrl()}${config.wordpressPlugin.downloadPath}`;
  },
  get versionedDownloadUrl() {
    const pattern =
      config.wordpressPlugin.versionedDownloadPath ??
      "/wordpress-plugin/splitsms-{version}.zip";
    const path = pattern.replace("{version}", config.wordpressPlugin.version);
    return `${getSiteUrl()}${path}`;
  },
  get versionedDownloadFilename() {
    return `splitsms-${config.wordpressPlugin.version}.zip`;
  },
  get updateCheckUrl() {
    return `${getSiteUrl()}${config.wordpressPlugin.updateCheckPath}`;
  },
  get docsUrl() {
    return `${getSiteUrl()}/integrations/wordpress`;
  },
  get apiDocsUrl() {
    return `${getSiteUrl()}/api-docs`;
  },
};

function sdkArtifact(kind: keyof SiteConfig["sdks"]) {
  const meta = config.sdks[kind];
  const base = getSiteUrl();
  const versionedPath = (meta.versionedDownloadPath ?? "").replace("{version}", meta.version);
  return {
    ...meta,
    get installBaseUrl() {
      return base;
    },
    get versionedDownloadUrl() {
      return `${base}${versionedPath}`;
    },
    get downloadUrl() {
      return `${base}${meta.downloadPath}`;
    },
    get composerRepositoryUrl() {
      return "composerRepoPath" in meta ? `${base}${meta.composerRepoPath}` : undefined;
    },
    get npmInstallCommand() {
      return `npm install ${base}${meta.downloadPath}`;
    },
  };
}

export const sdkPackages = {
  javascript: sdkArtifact("javascript"),
  php: sdkArtifact("php"),
  flutter: sdkArtifact("flutter"),
};

export const sdkManifestUrl = () => `${getSiteUrl()}/sdk/manifest.json`;

export { config as siteConfig };
