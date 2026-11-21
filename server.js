// Servidor estático simples para desenvolvimento local: npm start
const http = require("http"), fs = require("fs"), path = require("path");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".ico": "image/x-icon" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  if (!path.extname(p)) p += ".html";
  const f = path.join(__dirname, path.normalize(p));
  if (!f.startsWith(__dirname) || /node_modules|tools|server\.js/.test(p)) { res.writeHead(404); return res.end("404"); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("404"); } res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); res.end(d); });
}).listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));
