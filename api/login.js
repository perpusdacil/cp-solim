const { checkPassword, createSessionToken, setSessionCookie, TTL_MS } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var password = req.body && req.body.password;
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Password salah" });
  }
  var token = createSessionToken();
  setSessionCookie(res, token, Math.floor(TTL_MS / 1000));
  res.status(200).json({ ok: true });
};
