const express = require('express');
const path = require('path');
const http = require('http');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

http.createServer(app).listen(5000, '0.0.0.0', () => {
  console.log('Jade Royale on http://0.0.0.0:5000');
});

http.createServer(app).listen(8081, '0.0.0.0', () => {
  console.log('Jade Royale on http://0.0.0.0:8081');
});
