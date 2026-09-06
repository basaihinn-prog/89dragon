const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function prepareDirectories() {
  console.log("Preparing build directories...");

  if (fs.existsSync("static-build")) {
    fs.rmSync("static-build", { recursive: true });
  }

  fs.mkdirSync("static-build", { recursive: true });
}

function buildWebApp() {
  console.log("Building Expo web app...");
  
  try {
    execSync("npx expo export --platform web --output-dir static-build", {
      stdio: "inherit",
      env: { ...process.env }
    });
    console.log("Web build complete!");
  } catch (error) {
    exitWithError(`Build failed: ${error.message}`);
  }
}

function copyPublicFiles() {
  console.log("Copying public files...");
  
  const publicDir = "public";
  if (!fs.existsSync(publicDir)) {
    return;
  }
  
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    const src = path.join(publicDir, file);
    const dest = path.join("static-build", file);
    
    if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied: ${file}`);
    }
  }
}

function verifyBuild() {
  const indexPath = path.join("static-build", "index.html");
  if (!fs.existsSync(indexPath)) {
    exitWithError("Build verification failed: index.html not found");
  }
  
  const stats = fs.statSync(indexPath);
  console.log(`Build verified: index.html (${stats.size} bytes)`);
  
  const expoDir = path.join("static-build", "_expo");
  if (fs.existsSync(expoDir)) {
    console.log("Expo static assets directory found");
  }
  
  const installPath = path.join("static-build", "install.html");
  if (fs.existsSync(installPath)) {
    console.log("Install page included");
  }
}

async function main() {
  console.log("Building Jade Royale web app for deployment...");

  prepareDirectories();
  buildWebApp();
  copyPublicFiles();
  verifyBuild();

  console.log("Build complete! Ready for deployment.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Build failed:", error.message);
  process.exit(1);
});
