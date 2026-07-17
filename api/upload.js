const path = require("path");
const crypto = require("crypto");
const { isAuthed } = require("../lib/auth");
const { putFile } = require("../lib/github");

var SAFE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthed(req)) return res.status(401).json({ error: "Belum login" });

  try {
    var payload = req.body;
    var name = String((payload && payload.filename) || "upload");
    var ext = path.extname(name).toLowerCase();
    if (!SAFE_EXT.has(ext)) ext = ".png";
    var base =
      path
        .basename(name, path.extname(name))
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 60) || "image";

    var raw = (payload && payload.dataBase64) || "";
    var match = /^data:.*;base64,(.*)$/s.exec(raw);
    var b64 = match ? match[1] : raw;
    if (!b64) return res.status(400).json({ error: "dataBase64 kosong" });

    var unique = base + "-" + crypto.randomBytes(4).toString("hex") + ext;
    var repoPath = "images/uploads/" + unique;

    await putFile(repoPath, b64, "chore: upload gambar via admin panel", undefined);

    res.status(200).json({ ok: true, path: repoPath, deploying: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
