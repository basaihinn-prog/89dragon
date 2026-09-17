const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const distPath = path.join(__dirname, "dist");
const indexHtml = path.join(distPath, "index.html");

if (!fs.existsSync(indexHtml)) {
  console.error("Production web artifact is missing. Run `npm run build:web` before starting the server.");
  process.exit(1);
}

const proxyTarget = process.env.API_PROXY_TARGET;
if (proxyTarget) {
  const { createProxyMiddleware } = require("http-proxy-middleware");
  app.use("/api", createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    secure: true,
  }));
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=()");
  next();
});

app.use(express.static(distPath, {
  maxAge: "1d",
  etag: true,
  immutable: false,
}));

app.get("*", (req, res) => {
  res.sendFile(indexHtml);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Jade Royale web app listening on port ${PORT}`);
});
