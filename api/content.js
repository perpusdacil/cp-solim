const fs = require("fs");
const path = require("path");
const { isAuthed } = require("../lib/auth");
const { getFile, putFile } = require("../lib/github");

const REPO_PATH = "data/content.json";

module.exports = async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Belum login" });

  if (req.method === "GET") {
    try {
      var text = fs.readFileSync(path.join(process.cwd(), REPO_PATH), "utf8");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).send(text);
    } catch (e) {
      return res.status(500).json({ error: "content.json tidak terbaca" });
    }
  }

  if (req.method === "POST") {
    try {
      var parsed = req.body;
      if (!parsed || typeof parsed !== "object") {
        return res.status(400).json({ error: "JSON tidak valid" });
      }
      var pretty = JSON.stringify(parsed, null, 2) + "\n";
      var current = await getFile(REPO_PATH);
      await putFile(
        REPO_PATH,
        Buffer.from(pretty, "utf8").toString("base64"),
        "chore: update konten situs via admin panel",
        current ? current.sha : undefined
      );
      return res.status(200).json({ ok: true, deploying: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
