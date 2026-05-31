/**
 * Build SDK artifacts and publish to public/sdk/ for install-from-platform.
 * Run: npm run sync:sdks
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  readdirSync,
  unlinkSync,
  createReadStream,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const siteUrl = config.siteUrl.replace(/\/$/, "");
const sdks = config.sdks;

function sha1File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha1");
    const stream = createReadStream(filePath);
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function zipDirectory(sourceDir, outPath) {
  if (process.platform === "win32") {
    const psZip = [
      `$src = '${sourceDir.replace(/'/g, "''")}'`,
      `$out = '${outPath.replace(/'/g, "''")}'`,
      "if (Test-Path $out) { Remove-Item $out -Force }",
      "Push-Location $src",
      "Compress-Archive -Path * -DestinationPath $out -Force",
      "Pop-Location",
    ].join("; ");
    execSync(`powershell -NoProfile -Command "${psZip}"`, { stdio: "inherit", cwd: root });
  } else {
    execSync(`cd "${sourceDir}" && zip -r "${outPath}" . -x "*.DS_Store"`, { stdio: "inherit" });
  }
}

async function buildJavascript() {
  const jsDir = join(root, "sdk/javascript");
  const pubDir = join(root, "public/sdk/javascript");
  mkdirSync(pubDir, { recursive: true });

  execSync("npm run build", { cwd: jsDir, stdio: "inherit" });
  execSync("npm pack", { cwd: jsDir, stdio: "inherit" });

  const pkg = JSON.parse(readFileSync(join(jsDir, "package.json"), "utf8"));
  const version = pkg.version;
  const packed = readdirSync(jsDir).find((f) => f.endsWith(".tgz"));
  if (!packed) throw new Error("npm pack did not produce a .tgz file");

  const versionedName = `splitsms-sdk-${version}.tgz`;
  const versionedPath = join(pubDir, versionedName);
  const latestPath = join(pubDir, "splitsms-sdk.tgz");

  copyFileSync(join(jsDir, packed), versionedPath);
  copyFileSync(versionedPath, latestPath);
  unlinkSync(join(jsDir, packed));

  for (const file of readdirSync(pubDir)) {
    if (file.endsWith(".tgz") && file !== versionedName && file !== "splitsms-sdk.tgz") {
      unlinkSync(join(pubDir, file));
    }
  }

  return { version, versionedPath, latestPath, versionedName };
}

async function buildPhp() {
  const phpDir = join(root, "sdk/php");
  const pubDir = join(root, "public/sdk/php");
  mkdirSync(pubDir, { recursive: true });

  const composer = JSON.parse(readFileSync(join(phpDir, "composer.json"), "utf8"));
  const version = composer.version;
  const versionedName = `splitsms-sdk-${version}.zip`;
  const versionedPath = join(pubDir, versionedName);
  const latestPath = join(pubDir, "splitsms-sdk.zip");

  zipDirectory(phpDir, versionedPath);
  copyFileSync(versionedPath, latestPath);

  for (const file of readdirSync(pubDir)) {
    if (file.endsWith(".zip") && file !== versionedName && file !== "splitsms-sdk.zip") {
      unlinkSync(join(pubDir, file));
    }
  }

  const shasum = await sha1File(versionedPath);
  const packagesJson = {
    packages: {
      "splitsms/sdk": {
        [version]: {
          name: "splitsms/sdk",
          version,
          type: "library",
          license: "MIT",
          dist: {
            type: "zip",
            url: `${siteUrl}/sdk/php/${versionedName}`,
            shasum,
            reference: version,
          },
          require: composer.require,
          autoload: composer.autoload,
          homepage: composer.homepage,
        },
      },
    },
  };

  writeFileSync(join(pubDir, "packages.json"), JSON.stringify(packagesJson, null, 2) + "\n");

  return { version, versionedPath, versionedName, shasum };
}

async function buildFlutter() {
  const flutterDir = join(root, "sdk/flutter");
  const pubDir = join(root, "public/sdk/flutter");
  mkdirSync(pubDir, { recursive: true });

  const pubspec = readFileSync(join(flutterDir, "pubspec.yaml"), "utf8");
  const versionMatch = pubspec.match(/^version:\s*([\d.]+)/m);
  const version = versionMatch?.[1] ?? sdks.flutter.version;
  const versionedName = `splitsms-flutter-${version}.zip`;
  const versionedPath = join(pubDir, versionedName);
  const latestPath = join(pubDir, "splitsms-flutter.zip");

  zipDirectory(flutterDir, versionedPath);
  copyFileSync(versionedPath, latestPath);

  for (const file of readdirSync(pubDir)) {
    if (file.endsWith(".zip") && file !== versionedName && file !== "splitsms-flutter.zip") {
      unlinkSync(join(pubDir, file));
    }
  }

  return { version, versionedName };
}

async function main() {
  console.log("Building SDK artifacts…");
  const js = await buildJavascript();
  const php = await buildPhp();
  const flutter = await buildFlutter();

  const manifest = {
    updated_at: new Date().toISOString(),
    site_url: siteUrl,
    api_base: `${siteUrl}/api/v1`,
    docs_url: `${siteUrl}/sdk`,
    javascript: {
      name: sdks.javascript.packageName,
      version: js.version,
      install_npm_url: `${siteUrl}/sdk/javascript/${js.versionedName}`,
      install_npm_latest: `${siteUrl}/sdk/javascript/splitsms-sdk.tgz`,
      install_command: `npm install ${siteUrl}/sdk/javascript/splitsms-sdk.tgz`,
    },
    php: {
      name: sdks.php.packageName,
      version: php.version,
      composer_repository: `${siteUrl}/sdk/php/`,
      packages_json: `${siteUrl}/sdk/php/packages.json`,
      install_commands: [
        `composer config repositories.splitsms composer ${siteUrl}/sdk/php/`,
        "composer require splitsms/sdk",
      ],
      zip_url: `${siteUrl}/sdk/php/${php.versionedName}`,
    },
    flutter: {
      name: sdks.flutter.packageName,
      version: flutter.version,
      zip_url: `${siteUrl}/sdk/flutter/${flutter.versionedName}`,
      install_note:
        "Download zip, extract to packages/splitsms_flutter, then add path dependency in pubspec.yaml",
    },
  };

  const manifestDir = join(root, "public/sdk");
  mkdirSync(manifestDir, { recursive: true });
  writeFileSync(join(manifestDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log("SDK sync complete");
  console.log("JS:", manifest.javascript.install_command);
  console.log("PHP:", manifest.php.composer_repository);
  console.log("Flutter:", manifest.flutter.zip_url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
