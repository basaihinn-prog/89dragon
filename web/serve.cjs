const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = Number(process.env.PORT || 5000);
const distDir = path.join(__dirname, 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('Web build is missing. Run `npm run build` in web/ before starting the server.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  next();
});

app.use(express.static(distDir, {
  maxAge: '1d',
  etag: true,
}));

app.use((req, res) => {
  res.sendFile(indexHtml);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Jade Royale web app listening on port ${port}`);
});
