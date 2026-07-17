/* Solim Paint Specialist — local admin server.
   Zero dependencies: serves the static site, and exposes a tiny JSON API
   the admin panel uses to read/write data/content.json and upload images.
   Run: node server.js   (defaults to http://localhost:8787)
*/

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const CONTENT_PATH = path.join(ROOT, "data", "content.json");
const UPLOADS_DIR = path.join(ROOT, "images", "uploads");
const CREDENTIALS_PATH = path.join(ROOT, ".admin-credentials.json");
const PORT = process.env.PORT || 8787;

const SESSION_COOKIE = "solim_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
const sessions = new Map(); // token -> expiry timestamp

function loadOrCreatePassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    var existing = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
    if (existing && existing.password) return existing.password;
  } catch (e) {
    /* file belum ada atau rusak — buat baru di bawah */
  }
  var generated = crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify({ password: generated }, null, 2));
  return generated;
}
const ADMIN_PASSWORD = loadOrCreatePassword();

function safeEqual(a, b) {
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseCookies(req) {
  var header = req.headers.cookie || "";
  var out = {};
  header.split(";").forEach(function (pair) {
    var idx = pair.indexOf("=");
    if (idx === -1) return;
    var k = pair.slice(0, idx).trim();
    var v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function isAuthed(req) {
  var token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return false;
  var expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function createSession() {
  var token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function sessionCookieHeader(token, maxAgeSeconds) {
  return SESSION_COOKIE + "=" + token + "; HttpOnly; Path=/; Max-Age=" + maxAgeSeconds + "; SameSite=Lax";
}

/* per-IP login throttle: max 8 salah dalam 15 menit */
var loginAttempts = new Map();
function tooManyAttempts(ip) {
  var rec = loginAttempts.get(ip);
  var now = Date.now();
  if (!rec || rec.resetAt < now) {
    rec = { count: 0, resetAt: now + 15 * 60 * 1000 };
    loginAttempts.set(ip, rec);
  }
  return rec.count >= 8;
}
function recordFailedAttempt(ip) {
  var rec = loginAttempts.get(ip);
  if (rec) rec.count++;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "Access-Control-Allow-Origin": "*" }, headers || {}));
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" });
}

function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    var chunks = [];
    var size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* resolves a URL pathname to a file inside ROOT, refusing path traversal */
function resolveStaticPath(pathname) {
  var decoded = decodeURIComponent(pathname);
  if (decoded === "/") decoded = "/index.html";
  var full = path.normalize(path.join(ROOT, decoded));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function serveStatic(req, res, pathname) {
  var full = resolveStaticPath(pathname);
  if (!full) return send(res, 403, "Forbidden");
  fs.stat(full, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, "Not found");
    var ext = path.extname(full).toLowerCase();
    var mime = MIME[ext] || "application/octet-stream";
    fs.readFile(full, (readErr, data) => {
      if (readErr) return send(res, 500, "Read error");
      send(res, 200, data, { "Content-Type": mime, "Cache-Control": "no-cache" });
    });
  });
}

function handleGetContent(req, res) {
  fs.readFile(CONTENT_PATH, "utf8", (err, data) => {
    if (err) return sendJson(res, 500, { error: "content.json tidak terbaca" });
    send(res, 200, data, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
  });
}

function handlePostContent(req, res) {
  readBody(req, 10 * 1024 * 1024)
    .then((buf) => {
      var text = buf.toString("utf8");
      var parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        return sendJson(res, 400, { error: "JSON tidak valid: " + e.message });
      }
      var pretty = JSON.stringify(parsed, null, 2) + "\n";
      fs.writeFile(CONTENT_PATH, pretty, "utf8", (err) => {
        if (err) return sendJson(res, 500, { error: "Gagal menyimpan: " + err.message });
        sendJson(res, 200, { ok: true });
      });
    })
    .catch((err) => sendJson(res, 400, { error: err.message }));
}

function handleLogin(req, res) {
  var ip = req.socket.remoteAddress || "unknown";
  if (tooManyAttempts(ip)) {
    return sendJson(res, 429, { error: "Terlalu banyak percobaan salah. Coba lagi dalam beberapa menit." });
  }
  readBody(req, 4 * 1024)
    .then((buf) => {
      var payload;
      try {
        payload = JSON.parse(buf.toString("utf8"));
      } catch (e) {
        return sendJson(res, 400, { error: "Data tidak valid" });
      }
      var password = String(payload.password || "");
      if (!safeEqual(password, ADMIN_PASSWORD)) {
        recordFailedAttempt(ip);
        return sendJson(res, 401, { error: "Password salah" });
      }
      var token = createSession();
      send(res, 200, JSON.stringify({ ok: true }), {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": sessionCookieHeader(token, Math.floor(SESSION_TTL_MS / 1000)),
      });
    })
    .catch((err) => sendJson(res, 400, { error: err.message }));
}

function handleLogout(req, res) {
  var token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  send(res, 200, JSON.stringify({ ok: true }), {
    "Content-Type": "application/json; charset=utf-8",
    "Set-Cookie": sessionCookieHeader("", 0),
  });
}

var SAFE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function handleUpload(req, res) {
  readBody(req, 15 * 1024 * 1024)
    .then((buf) => {
      var payload;
      try {
        payload = JSON.parse(buf.toString("utf8"));
      } catch (e) {
        return sendJson(res, 400, { error: "JSON tidak valid" });
      }
      var name = String(payload.filename || "upload");
      var ext = path.extname(name).toLowerCase();
      if (!SAFE_EXT.has(ext)) ext = ".png";
      var base = path
        .basename(name, path.extname(name))
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 60) || "image";
      var match = /^data:.*;base64,(.*)$/s.exec(payload.dataBase64 || "");
      var b64 = match ? match[1] : payload.dataBase64;
      if (!b64) return sendJson(res, 400, { error: "dataBase64 kosong" });
      var bytes = Buffer.from(b64, "base64");
      var unique = base + "-" + crypto.randomBytes(4).toString("hex") + ext;
      fs.mkdir(UPLOADS_DIR, { recursive: true }, (mkErr) => {
        if (mkErr) return sendJson(res, 500, { error: "Gagal membuat folder upload" });
        var dest = path.join(UPLOADS_DIR, unique);
        fs.writeFile(dest, bytes, (err) => {
          if (err) return sendJson(res, 500, { error: "Gagal menyimpan file: " + err.message });
          sendJson(res, 200, { ok: true, path: "images/uploads/" + unique });
        });
      });
    })
    .catch((err) => sendJson(res, 400, { error: err.message }));
}

const server = http.createServer((req, res) => {
  var url = new URL(req.url, "http://localhost");
  var pathname = url.pathname;

  if (req.method === "OPTIONS") {
    return send(res, 204, "", {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
  }

  if (pathname === "/api/login" && req.method === "POST") return handleLogin(req, res);
  if (pathname === "/api/logout" && req.method === "POST") return handleLogout(req, res);

  if (pathname.indexOf("/api/") === 0) {
    if (!isAuthed(req)) return sendJson(res, 401, { error: "Belum login" });
    if (pathname === "/api/content" && req.method === "GET") return handleGetContent(req, res);
    if (pathname === "/api/content" && req.method === "POST") return handlePostContent(req, res);
    if (pathname === "/api/upload" && req.method === "POST") return handleUpload(req, res);
  }

  if (pathname === "/admin.html" && req.method === "GET" && !isAuthed(req)) {
    return send(res, 302, "", { Location: "/login.html" });
  }

  if (req.method === "GET") return serveStatic(req, res, pathname);

  send(res, 405, "Method not allowed");
});

server.listen(PORT, () => {
  console.log("Solim admin server jalan di http://localhost:" + PORT);
  console.log("Situs: http://localhost:" + PORT + "/index.html");
  console.log("Admin: http://localhost:" + PORT + "/admin.html (login diperlukan)");
  if (!process.env.ADMIN_PASSWORD) {
    console.log("Password admin (tersimpan di .admin-credentials.json): " + ADMIN_PASSWORD);
    console.log("Ganti dengan set env var ADMIN_PASSWORD sebelum hosting publik.");
  }
});
