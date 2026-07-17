/* SOLIM Paint Specialist — content binding engine
   Reads data/content.json and fills [data-bind*] / [data-list] hooks.
   Falls back silently to the static HTML already in the page if the fetch fails.

   Attributes (path is dot-notation against the current data scope; "." means
   "the scope value itself", used for arrays of plain strings):
     data-bind="path"          -> textContent
     data-bind-html="path"     -> innerHTML
     data-bind-src="path"      -> src
     data-bind-href="path"     -> href
     data-bind-alt="path"      -> alt
     data-bind-attr="attr:path"   -> setAttribute(attr, value)
     data-bind-style="--var:path:suffix?" -> style.setProperty(--var, value+suffix)
     data-list="path"          on a container; its first child with data-item
                                is the template, cloned once per array entry.
                                Lists may nest: each clone is re-rendered with
                                that entry as the new data scope.
     data-list-repeat="N"      repeat the whole array N times (e.g. marquees)
     data-list-active-index="N" adds class="active" to the Nth rendered clone
     data-list-ref="collectionPath"  the data-list path is read as an array of
                                id strings; each id is looked up by .id in the
                                collection at collectionPath (resolved against
                                the top-level document, e.g. "projects") and
                                the matching record becomes that item's scope.
                                Used to feature/curate items from a shared
                                collection without duplicating their content.
*/

(function () {
  "use strict";

  var PLAIN_SELECTOR =
    "[data-bind], [data-bind-html], [data-bind-src], [data-bind-href], [data-bind-alt], [data-bind-attr], [data-bind-style]";

  function getPath(scope, path) {
    if (path === ".") return scope;
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, scope);
  }

  function hasListAncestorWithin(el, root) {
    var n = el.parentElement;
    while (n && n !== root) {
      if (n.matches && n.matches("[data-list]")) return true;
      n = n.parentElement;
    }
    return false;
  }

  function applyPlain(el, scope) {
    if (el.hasAttribute("data-bind")) {
      var v = getPath(scope, el.getAttribute("data-bind"));
      if (v != null) el.textContent = v;
    }
    if (el.hasAttribute("data-bind-html")) {
      var vh = getPath(scope, el.getAttribute("data-bind-html"));
      if (vh != null) el.innerHTML = vh;
    }
    if (el.hasAttribute("data-bind-src")) {
      var vs = getPath(scope, el.getAttribute("data-bind-src"));
      if (vs != null) el.setAttribute("src", vs);
    }
    if (el.hasAttribute("data-bind-href")) {
      var vhr = getPath(scope, el.getAttribute("data-bind-href"));
      if (vhr != null) el.setAttribute("href", vhr);
    }
    if (el.hasAttribute("data-bind-alt")) {
      var va = getPath(scope, el.getAttribute("data-bind-alt"));
      if (va != null) el.setAttribute("alt", va);
    }
    if (el.hasAttribute("data-bind-attr")) {
      var parts = el.getAttribute("data-bind-attr").split(":");
      var vattr = getPath(scope, parts[1]);
      if (vattr != null) el.setAttribute(parts[0], vattr);
    }
    if (el.hasAttribute("data-bind-style")) {
      var sp = el.getAttribute("data-bind-style").split(":");
      var vstyle = getPath(scope, sp[1]);
      if (vstyle != null) el.style.setProperty(sp[0], vstyle + (sp[2] || ""));
    }
  }

  function render(root, scope, globalData) {
    globalData = globalData || scope;

    var plainEls = [];
    if (root.matches && root.matches(PLAIN_SELECTOR)) plainEls.push(root);
    root.querySelectorAll(PLAIN_SELECTOR).forEach(function (el) {
      if (!hasListAncestorWithin(el, root)) plainEls.push(el);
    });
    plainEls.forEach(function (el) {
      applyPlain(el, scope);
    });

    var listContainers = [];
    if (root.matches && root.matches("[data-list]")) listContainers.push(root);
    root.querySelectorAll("[data-list]").forEach(function (el) {
      if (!hasListAncestorWithin(el, root)) listContainers.push(el);
    });

    listContainers.forEach(function (container) {
      var path = container.getAttribute("data-list");
      var raw = getPath(scope, path);
      if (!Array.isArray(raw)) return;

      var refPath = container.getAttribute("data-list-ref");
      var arr = raw;
      if (refPath) {
        var collection = getPath(globalData, refPath) || [];
        arr = raw
          .map(function (id) {
            return collection.filter(function (rec) {
              return rec && rec.id === id;
            })[0];
          })
          .filter(Boolean);
      }

      var directItems = Array.prototype.filter.call(container.children, function (c) {
        return c.hasAttribute("data-item");
      });
      if (!directItems.length) return;
      var template = directItems[0];
      var proto = template.cloneNode(true);
      var repeat = parseInt(container.getAttribute("data-list-repeat") || "1", 10);
      var activeIdx = container.getAttribute("data-list-active-index");

      for (var r = 0; r < repeat; r++) {
        arr.forEach(function (itemData, i) {
          var node = proto.cloneNode(true);
          node.removeAttribute("data-item");
          if (activeIdx === String(i)) node.classList.add("active");
          render(node, itemData, globalData);
          container.insertBefore(node, template);
        });
      }
      directItems.forEach(function (n) {
        n.remove();
      });
    });
  }

  /* bridges the canonical `projects[]` record shape into the flat
     `pages.project.*` shape the detail template's data-bind paths expect,
     so project.html itself needs zero markup changes */
  function buildProjectDetailScope(project, allProjects) {
    var idx = allProjects.indexOf(project);
    var next = allProjects[(idx + 1) % allProjects.length];
    var d = project.detail || {};
    return {
      meta: { title: d.metaTitle, description: d.metaDescription },
      hero: {
        eyebrow: d.heroEyebrow,
        title: project.title,
        image: d.heroImage,
        imageAlt: d.heroImageAlt,
      },
      facts: d.facts,
      narrative: {
        eyebrow: d.narrativeEyebrow,
        title: d.narrativeTitle,
        paragraphs: d.narrativeParagraphs,
      },
      beforeAfter: d.beforeAfter,
      gallery: d.gallery,
      materials: {
        eyebrow: d.materialsEyebrow,
        title: d.materialsTitle,
        tags: d.materialsTags,
        linkLabel: d.materialsLinkLabel,
        linkHref: d.materialsLinkHref,
      },
      nextProject: {
        image: (next.detail || {}).heroImage || next.image,
        eyebrow: "Proyek Berikutnya",
        title: next.title,
        href: next.href,
      },
    };
  }

  function markActiveNavLink() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav .nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === current);
    });
  }

  function applyMeta(data) {
    var titleEl = document.querySelector("[data-bind-title]");
    if (titleEl) {
      var t = getPath(data, titleEl.getAttribute("data-bind-title"));
      if (t != null) document.title = t;
    }
    var descEl = document.querySelector("[data-bind-meta-desc]");
    if (descEl) {
      var d = getPath(data, descEl.getAttribute("data-bind-meta-desc"));
      if (d != null) descEl.setAttribute("content", d);
    }
  }

  function init() {
    fetch("data/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("content.json " + res.status);
        return res.json();
      })
      .then(function (data) {
        window.__SOLIM_CONTENT__ = data;

        var isProjectDetail = location.pathname.split("/").pop() === "project.html";
        if (isProjectDetail && Array.isArray(data.projects) && data.projects.length) {
          var wantId = new URLSearchParams(location.search).get("id");
          var found =
            data.projects.filter(function (p) {
              return p.id === wantId;
            })[0] || data.projects[0];
          data.pages.project = buildProjectDetailScope(found, data.projects);
        }

        applyMeta(data);
        render(document.body, data, data);
        markActiveNavLink();
        document.dispatchEvent(new CustomEvent("solim:content-ready", { detail: data }));
      })
      .catch(function (err) {
        console.warn("Konten dinamis gagal dimuat, memakai isi statis.", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
