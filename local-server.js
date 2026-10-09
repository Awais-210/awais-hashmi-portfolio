const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'data.json');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // API Route: GET /api/data
  if (req.method === 'GET' && urlPath === '/api/data') {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read data.json' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // API Route: POST /api/data (Saves updated JSON directly to data.json file on disk)
  if (req.method === 'POST' && urlPath === '/api/data') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Data saved successfully to data.json on disk!' }));
      } catch (err) {
        console.error("Error saving data:", err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API Route: POST /api/upload-file (Saves image or PDF directly to assets folder on disk)
  if (req.method === 'POST' && urlPath === '/api/upload-file') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { fileName, fileData } = JSON.parse(body);
        if (!fileName || !fileData) {
          throw new Error("Missing fileName or fileData");
        }

        // Clean filename & base64 prefix
        const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9_\.-]/g, '_');
        const targetPath = path.join(ASSETS_DIR, safeName);
        const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');

        fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));

        const relativeUrl = `assets/${safeName}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: relativeUrl, message: `File saved to ${relativeUrl} on disk!` }));
      } catch (err) {
        console.error("Error uploading file:", err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve Static Files & Clean Routes (/admin -> admin.html, / -> index.html)
  let cleanPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  if (cleanPath === 'admin' || cleanPath === 'admin/') {
    cleanPath = 'admin.html';
  }

  let filePath = path.join(ROOT_DIR, cleanPath);
  if (!path.extname(filePath) && !fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  let ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 Not Found</h1><p>The requested route <code>${urlPath}</code> could not be found.</p><p><a href="/admin.html">Go to Admin Dashboard</a> | <a href="/">Go to Home</a></p>`);
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Portfolio & Admin Server running at http://localhost:${PORT}`);
});
