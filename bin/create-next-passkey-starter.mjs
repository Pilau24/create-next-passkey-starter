#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDED_ENTRIES = new Set([
  ".git",
  ".github",
  ".next",
  ".vscode",
  "bin",
  "node_modules",
  ".env",
  "AGENTS.md",
  "dev.db",
  "coverage",
  "dist",
  ".artifacts",
  "skills-lock.json",
  "pnpm-workspace.yaml",
]);

function printUsage() {
  console.log(`Usage: pnpm create next-passkey-starter <directory> [options]

Options:
  --force   Allow an existing, non-empty directory to be overwritten
  --help    Show this help message
`);
}

function getProjectName(targetDirectory) {
  const directoryName = basename(targetDirectory);
  const name = directoryName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return name || "next-passkey-app";
}

function parseArguments(args) {
  let targetDirectory;
  let force = false;

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (targetDirectory) {
      throw new Error("Only one target directory may be provided.");
    }

    targetDirectory = arg;
  }

  if (!targetDirectory) {
    throw new Error("A target directory is required.");
  }

  return { force, targetDirectory: resolve(process.cwd(), targetDirectory) };
}

function ensureDestinationIsSafe(targetDirectory, force) {
  if (!existsSync(targetDirectory)) {
    mkdirSync(targetDirectory, { recursive: true });
    return;
  }

  if (!statSync(targetDirectory).isDirectory()) {
    throw new Error(`The target path is not a directory: ${targetDirectory}`);
  }

  const entries = readdirSync(targetDirectory);
  if (entries.length > 0 && !force) {
    throw new Error(
      `The target directory is not empty: ${targetDirectory}. Use --force to overwrite it.`,
    );
  }
}

function copyTemplate(targetDirectory) {
  for (const entry of readdirSync(PACKAGE_ROOT)) {
    if (EXCLUDED_ENTRIES.has(entry)) {
      continue;
    }

    cpSync(join(PACKAGE_ROOT, entry), join(targetDirectory, entry), {
      recursive: true,
      force: true,
    });
  }
}

function writeGeneratedPackageJson(targetDirectory) {
  const packageJsonPath = join(targetDirectory, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.name = getProjectName(targetDirectory);
  delete packageJson.bin;
  delete packageJson.files;
  delete packageJson.publishConfig;
  delete packageJson.description;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function printNextSteps(targetDirectory) {
  const relativeTarget = targetDirectory === process.cwd()
    ? "."
    : targetDirectory.replace(`${process.cwd()}\\`, "");

  console.log(`
Created ${relativeTarget} with passkey authentication.

Next steps:
  cd ${relativeTarget}
  Copy-Item .env.example .env
  pnpm install
  pnpm prisma migrate dev
  pnpm dev

Read the generated README for environment and deployment guidance.
`);
}

async function main() {
  const { force, targetDirectory } = parseArguments(process.argv.slice(2));
  ensureDestinationIsSafe(targetDirectory, force);
  copyTemplate(targetDirectory);
  writeGeneratedPackageJson(targetDirectory);
  printNextSteps(targetDirectory);
}

try {
  await main();
} catch (error) {
  console.error(`\nCould not create the starter: ${error.message}`);
  process.exitCode = 1;
}
