import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  createReadStream,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const SCHEMA_URI = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

const publicDir = join(import.meta.dirname, "..", "public");
const wellKnownDir = join(publicDir, ".well-known", "agent-skills");
const stelagentCliDir = join(wellKnownDir, "stelagent-cli");

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(`sha256:${hash.digest("hex")}`));
    stream.on("error", reject);
  });
}

function hashDirectory(dir: string): string {
  const hash = createHash("sha256");

  function walk(current: string) {
    const entries = readdirSync(current).sort();
    for (const entry of entries) {
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        hash.update(`dir:${entry}\n`);
        walk(fullPath);
      } else {
        hash.update(`file:${entry}\n`);
        hash.update(readFileSync(fullPath));
      }
    }
  }

  walk(dir);
  return hash.digest("hex");
}

async function main(): Promise<void> {
  const skillMdPath = join(stelagentCliDir, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    console.error("SKILL.md not found at", skillMdPath);
    process.exit(1);
  }

  const contentHash = hashDirectory(stelagentCliDir);
  const archivePath = join(wellKnownDir, "stelagent-cli.tar.gz");
  const indexPath = join(wellKnownDir, "index.json");

  if (existsSync(indexPath) && existsSync(archivePath)) {
    const existing = JSON.parse(readFileSync(indexPath, "utf-8"));
    const storedHash = existing.skills[0]._contentHash;
    if (storedHash === contentHash) {
      console.log("No changes detected, skipping build.");
      return;
    }
  }

  execSync(`tar -czf "${archivePath}" -C "${stelagentCliDir}" .`, { stdio: "inherit" });
  console.log("Created archive:", archivePath);

  const archiveDigest = await sha256File(archivePath);
  console.log("Archive digest:", archiveDigest);

  const index = {
    $schema: SCHEMA_URI,
    skills: [
      {
        name: "stelagent-cli",
        type: "archive",
        description:
          "Manage Stellar wallets, send payments, make X402 HTTP payments, query on-chain data, and expose everything via MCP. Use this skill when the user wants to set up a Stellar wallet, log in, verify OTP, check wallet balance, send XLM or assets, make X402 payments, view wallet address, query account data, search assets, check fees, stream live events, start an MCP server, or any other interaction with the stelagent CLI for Stellar.",
        url: "/.well-known/agent-skills/stelagent-cli.tar.gz",
        digest: archiveDigest,
        _contentHash: contentHash,
      },
    ],
  };

  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log("Updated index:", indexPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
