import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 8080);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const sendFile = (response, filePath) => {
  const extension = extname(filePath);
  const contentType = contentTypes[extension] || 'application/octet-stream';

  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });

  createReadStream(filePath).pipe(response);
};

createServer((request, response) => {
  const requestedPath = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
  const safePath = normalize(join(distDir, requestedPath));

  if (safePath.startsWith(distDir) && existsSync(safePath) && statSync(safePath).isFile()) {
    sendFile(response, safePath);
    return;
  }

  const indexPath = join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    sendFile(response, indexPath);
    return;
  }

  response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Frontend build output not found.');
}).listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});
