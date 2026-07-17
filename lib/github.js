/* Git-backed persistence: admin saves commit straight to the GitHub repo via
   the Contents API. Vercel is connected to this repo, so every commit
   triggers an automatic redeploy — the live site updates ~30-60s later.
   No database needed; the repo itself stays the single source of truth. */

function config() {
  var token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN belum di-set di environment variables Vercel");
  return {
    token: token,
    owner: process.env.GITHUB_OWNER || "perpusdacil",
    repo: process.env.GITHUB_REPO || "cp-solim",
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

function api(pathPart) {
  var c = config();
  return "https://api.github.com/repos/" + c.owner + "/" + c.repo + "/contents/" + pathPart;
}

function headers() {
  var c = config();
  return {
    Authorization: "Bearer " + c.token,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "solim-admin",
  };
}

/* returns { sha, contentBase64 } or null if the file doesn't exist yet */
async function getFile(repoPath) {
  var c = config();
  var res = await fetch(api(repoPath) + "?ref=" + encodeURIComponent(c.branch), {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("GitHub GET " + repoPath + " gagal: " + res.status + " " + (await res.text()));
  var json = await res.json();
  return { sha: json.sha, contentBase64: json.content.replace(/\n/g, "") };
}

/* creates or updates a file; base64Content is the raw base64 payload (no data: prefix) */
async function putFile(repoPath, base64Content, message, existingSha) {
  var c = config();
  var body = {
    message: message,
    content: base64Content,
    branch: c.branch,
  };
  if (existingSha) body.sha = existingSha;
  var res = await fetch(api(repoPath), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("GitHub PUT " + repoPath + " gagal: " + res.status + " " + (await res.text()));
  return res.json();
}

module.exports = { getFile, putFile };
