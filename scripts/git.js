const { spawnSync } = require("node:child_process");

const message = process.argv.slice(2).join(" ").trim();

if (!message) {
  console.error('Usage: npm run git -- "your commit message"');
  process.exit(1);
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("git", ["add", "-A"]);
run("git", ["commit", "-m", message]);
run("git", ["push"]);

