const express = require("express");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const app = express();
const PORT = 5000;

// Simple proxy for API requests to avoid CORS during local smoke tests.
// Proxies any request starting with /api to the production backend.
try {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  app.use('/api', createProxyMiddleware({
    target: 'https://bxbet.asia',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/api': '/api' },
    onProxyReq: (proxyReq, req, res) => {
      // ensure host header points to target
      proxyReq.setHeader('host', 'bxbet.asia');
    }
  }));
} catch (err) {
  // http-proxy-middleware not installed yet; the server will still serve static files.
  console.warn('http-proxy-middleware not available; run `npm install http-proxy-middleware` to enable local API proxy.');
}

const distPath = path.join(__dirname, "dist");
const indexHtml = path.join(distPath, "index.html");

async function ensureBuild() {
  if (!fs.existsSync(indexHtml)) {
    console.log("Web build not found. Building now...");
    try {
      execSync("npx expo export --platform web", { 
        stdio: "inherit",
        env: { ...process.env }
      });
      console.log("Build complete!");
    } catch (error) {
      console.error("Build failed:", error.message);
      process.exit(1);
    }
  } else {
    console.log("Using existing web build from dist/");
  }
}

async function startServer() {
  await ensureBuild();

  app.use(express.static(distPath, {
    maxAge: "1d",
    etag: true
  }));

  // Catch-all: serve index.html for any unmatched route
  app.use((req, res) => {
    res.sendFile(indexHtml);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jade Royale web app running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
