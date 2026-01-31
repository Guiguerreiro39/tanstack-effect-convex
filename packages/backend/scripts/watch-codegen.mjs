import { execSync } from "node:child_process";
import path from "node:path";
import watcher from "@parcel/watcher";

const dir = path.join(process.cwd(), "src/convex");

console.log(`🚀 Watching ${dir} for contract changes...`);

await watcher.subscribe(
  dir,
  (err, _events) => {
    if (err) {
      throw err;
    }
    console.log("✨ Change detected, running codegen...");
    try {
      // This runs your existing pnpm script
      execSync("pnpm codegen:contract", { stdio: "inherit" });
    } catch (e) {
      console.error("❌ Codegen failed:", e.message);
    }
  },
  {
    ignore: ["_generated", "lib/contracts"],
  }
);
