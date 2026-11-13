import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json', '.png':'image/png', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8' };
const server = createServer(async(req,res)=>{
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const safe = resolve(root, '.' + path);
    if (safe !== root && !safe.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    let file = safe;
    try { if (!(await stat(file)).isFile()) file = resolve(root,'index.html'); }
    catch { file = resolve(root,'index.html'); }
    const buf = await readFile(file);
    res.writeHead(200,{ 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(buf);
  } catch(e) { res.writeHead(500); res.end(String(e)); }
});
server.listen(port,'0.0.0.0',()=>console.log(`Security Platform: http://localhost:${port}`));
