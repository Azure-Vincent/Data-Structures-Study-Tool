#!/usr/bin/env node
// Zero-dependency local web server for DS Study Lab (browser mode).
// Usage: node server.js [port]   — then open http://localhost:<port>
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'app');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };
const port = Number(process.argv[2] || process.env.PORT || 5173);

const server = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    await stat(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}/`;
  console.log(`DS Study Lab is running at ${url}  (press Ctrl+C to stop)`);
  if (process.argv.includes('--open') || process.env.DSLAB_OPEN) {
    const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${port} is busy. Try: node server.js ${port + 1}`);
  else console.error(e);
  process.exit(1);
});
