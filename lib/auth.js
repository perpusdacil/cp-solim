/* Stateless session helpers for Vercel serverless functions.
   No server-side session store (functions are stateless across invocations) —
   the session is a signed cookie: base64url(payload) + "." + HMAC-SHA256.
   Verifying only needs the secret, so it survives cold starts and redeploys. */

const crypto = require("crypto");

const COOKIE_NAME = "solim_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function secret() {
  var pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD belum di-set di environment variables Vercel");
  return "solim-admin-session:" + pw;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function safeEqual(a, b) {
  var bufA = Buffer.from(String(a));
  var bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function checkPassword(candidate) {
  var expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // belum dikonfigurasi -> tolak, jangan lolos lewat password kosong
  return safeEqual(String(candidate || ""), expected);
}

function sign(payload) {
  var body = b64url(JSON.stringify(payload));
  var sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + sig;
}

function verify(token) {
  if (!token) return null;
  var parts = token.split(".");
  if (parts.length !== 2) return null;
  var expected = crypto.createHmac("sha256", secret()).update(parts[0]).digest("base64url");
  var a = Buffer.from(parts[1]);
  var b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  var payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}

function createSessionToken() {
  return sign({ exp: Date.now() + TTL_MS });
}

function parseCookies(req) {
  var header = (req.headers && req.headers.cookie) || "";
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
  var token = parseCookies(req)[COOKIE_NAME];
  return !!verify(token);
}

function setSessionCookie(res, token, maxAgeSeconds) {
  res.setHeader(
    "Set-Cookie",
    COOKIE_NAME + "=" + token + "; HttpOnly; Path=/; Max-Age=" + maxAgeSeconds + "; SameSite=Lax; Secure"
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", COOKIE_NAME + "=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure");
}

module.exports = {
  TTL_MS,
  checkPassword,
  createSessionToken,
  isAuthed,
  setSessionCookie,
  clearSessionCookie,
};
