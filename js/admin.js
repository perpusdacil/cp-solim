/* Solim Paint Specialist — admin CMS
   Generic recursive form: renders/edits any node of data/content.json
   (strings, numbers, nested objects, arrays of strings, arrays of objects)
   without per-page hand-written forms. Saves the whole document back via
   POST /api/content. Images upload via POST /api/upload (base64 JSON body).

   Layout: each section (site/nav/footer/each page) splits its top-level
   keys into collapsible subsections (grouping plain scalar fields into one
   "Info Umum" group, and giving every array/object its own group) with a
   quick-jump bar + expand/collapse-all. Array-of-object lists render as
   accordions (collapsed summary with thumbnail/title preview) with full
   CRUD: add, reorder, delete (confirmed), and a search box once a list
   gets long.
*/

(function () {
  "use strict";

  var STATE = null;
  var DIRTY = false;

  var SECTIONS = [
    { group: "Global", key: "site", label: "Pengaturan Situs" },
    { group: "Global", key: "nav", label: "Menu Navigasi" },
    { group: "Global", key: "footer", label: "Footer" },
    { group: "Halaman", key: "pages.home", label: "Beranda" },
    { group: "Halaman", key: "pages.about", label: "Tentang Kami" },
    { group: "Halaman", key: "pages.services", label: "Layanan" },
    { group: "Halaman", key: "pages.portfolio", label: "Halaman Daftar Proyek" },
    { group: "Halaman", key: "pages.awards", label: "Sertifikasi & Garansi" },
    { group: "Halaman", key: "pages.insights", label: "Artikel" },
    { group: "Halaman", key: "pages.contact", label: "Kontak" },
    { group: "Data", key: "projects", label: "Semua Proyek (CRUD + Detail)" },
  ];

  /* ---------- path helpers ---------- */
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  /* ---------- ui helpers ---------- */
  function humanize(key) {
    var s = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    s = s.replace(/[_-]+/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function toast(msg, kind) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show" + (kind ? " " + kind : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      t.classList.remove("show");
    }, 3200);
  }

  function markDirty() {
    DIRTY = true;
    document.getElementById("save-btn").disabled = false;
    document.getElementById("status-text").textContent = "Ada perubahan belum disimpan";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function isContainer(v) {
    return v !== null && typeof v === "object";
  }

  /* ---------- field type heuristics ---------- */
  function isImageKey(key) {
    return /(^|[A-Z])image($|[A-Z])/i.test(key) || key === "src" || /Src$/.test(key);
  }
  function isHtmlKey(key) {
    return /Html$/.test(key);
  }
  function isLongTextKey(key, value) {
    return /desc|lead|paragraph|quote|excerpt|note|body/i.test(key) || (typeof value === "string" && value.length > 70);
  }

  /* preview text/thumbnail for a collapsed array-item card */
  function previewLabel(item) {
    var priority = ["title", "label", "name", "k", "eyebrow", "date"];
    for (var i = 0; i < priority.length; i++) {
      if (typeof item[priority[i]] === "string" && item[priority[i]]) return item[priority[i]];
    }
    var keys = Object.keys(item);
    for (var j = 0; j < keys.length; j++) {
      if (typeof item[keys[j]] === "string" && item[keys[j]] && !isImageKey(keys[j])) return item[keys[j]];
    }
    return "Item";
  }
  function previewImage(item) {
    var keys = Object.keys(item);
    for (var i = 0; i < keys.length; i++) {
      if (isImageKey(keys[i]) && typeof item[keys[i]] === "string") return item[keys[i]];
    }
    return null;
  }
  function truncate(s, n) {
    s = String(s);
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  /* ---------- renderers ---------- */
  function renderField(container, obj, key, path, label, opts) {
    opts = opts || {};
    var value = obj[key];
    if (value === null || value === undefined) value = "";

    if (Array.isArray(value)) {
      renderArray(container, value, path, label, opts);
      return;
    }
    if (typeof value === "object") {
      renderObject(container, value, path, label, opts);
      return;
    }
    if (typeof value === "number") {
      renderNumberField(container, obj, key, label);
      return;
    }
    if (isImageKey(key)) {
      renderImageField(container, obj, key, label);
      return;
    }
    if (isHtmlKey(key) || isLongTextKey(key, value)) {
      renderTextareaField(container, obj, key, label);
      return;
    }
    renderTextField(container, obj, key, label);
  }

  function fieldWrap(label, inner) {
    var block = el("div", { class: "field-block" });
    block.appendChild(el("label", { text: label }));
    block.appendChild(inner);
    return block;
  }

  function renderTextField(container, obj, key, label) {
    var input = el("input", { type: "text" });
    input.value = obj[key];
    input.addEventListener("input", function () {
      obj[key] = input.value;
      markDirty();
    });
    container.appendChild(fieldWrap(label, input));
  }

  function renderNumberField(container, obj, key, label) {
    var input = el("input", { type: "number" });
    input.value = obj[key];
    input.addEventListener("input", function () {
      obj[key] = input.value === "" ? 0 : Number(input.value);
      markDirty();
    });
    container.appendChild(fieldWrap(label, input));
  }

  function renderTextareaField(container, obj, key, label) {
    var ta = el("textarea", {});
    ta.value = obj[key];
    ta.addEventListener("input", function () {
      obj[key] = ta.value;
      markDirty();
    });
    container.appendChild(fieldWrap(label, ta));
  }

  function renderImageField(container, obj, key, label) {
    var wrap = el("div", { class: "image-field" });
    var preview = el("img", { src: obj[key] || "" });
    preview.onerror = function () {
      preview.style.visibility = "hidden";
    };
    preview.onload = function () {
      preview.style.visibility = "visible";
    };
    var col = el("div", { class: "col" });
    var input = el("input", { type: "text" });
    input.value = obj[key] || "";
    input.addEventListener("input", function () {
      obj[key] = input.value;
      preview.src = input.value;
      markDirty();
    });
    var uploadRow = el("div", { class: "upload-row" });
    var fileInput = el("input", { type: "file", accept: "image/*" });
    var uploadStatus = el("span", { text: "" });
    uploadStatus.style.fontSize = "0.75rem";
    uploadStatus.style.color = "#5c584f";
    fileInput.addEventListener("change", function () {
      var file = fileInput.files[0];
      if (!file) return;
      uploadStatus.textContent = "Mengunggah…";
      var reader = new FileReader();
      reader.onload = function () {
        fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, dataBase64: reader.result }),
        })
          .then(function (r) {
            if (r.status === 401) {
              goToLogin();
              return Promise.reject(new Error("unauthenticated"));
            }
            return r.json();
          })
          .then(function (data) {
            if (data.error) throw new Error(data.error);
            obj[key] = data.path;
            input.value = data.path;
            preview.src = data.path;
            uploadStatus.textContent = data.deploying
              ? "Terunggah — muncul ~30-60 detik lagi setelah redeploy."
              : "Terunggah.";
            markDirty();
          })
          .catch(function (err) {
            if (err.message === "unauthenticated") return;
            uploadStatus.textContent = "Gagal: " + err.message;
          });
      };
      reader.readAsDataURL(file);
    });
    uploadRow.appendChild(fileInput);
    uploadRow.appendChild(uploadStatus);
    col.appendChild(input);
    col.appendChild(uploadRow);
    wrap.appendChild(preview);
    wrap.appendChild(col);
    container.appendChild(fieldWrap(label, wrap));
  }

  function renderObject(container, value, path, label, opts) {
    opts = opts || {};
    var target;
    if (opts.skipBox) {
      target = container;
    } else {
      target = el("div", { class: "obj-box" });
      if (label) target.appendChild(el("p", { class: "obj-title", text: label }));
      container.appendChild(target);
    }
    Object.keys(value).forEach(function (k) {
      renderField(target, value, k, path + "." + k, humanize(k));
    });
  }

  function blankLike(value) {
    if (typeof value === "string") return "";
    if (typeof value === "number") return 0;
    if (Array.isArray(value)) return value.map(blankLike);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (k) {
        out[k] = blankLike(value[k]);
      });
      return out;
    }
    return value;
  }

  function renderArray(container, arr, path, label, opts) {
    opts = opts || {};
    var target;
    if (opts.skipBox) {
      target = container;
    } else {
      target = el("div", { class: "obj-box" });
      if (label) target.appendChild(el("p", { class: "obj-title", text: label }));
      container.appendChild(target);
    }

    var isStringArray = arr.length === 0 || typeof arr[0] !== "object";
    var searchInput = null;
    if (!isStringArray && arr.length >= 5) {
      searchInput = el("input", {
        type: "text",
        class: "array-search",
        placeholder: "Cari di " + (label || "daftar ini").toLowerCase() + "…",
      });
      target.appendChild(searchInput);
    }

    var list = el("div", { class: isStringArray ? "" : "array-list" });
    target.appendChild(list);

    function rerender(focusIndex) {
      list.innerHTML = "";
      if (isStringArray) {
        arr.forEach(function (item, i) {
          var row = el("div", { class: "array-string-row" });
          var input = el("input", { type: "text" });
          input.value = item;
          input.addEventListener("input", function () {
            arr[i] = input.value;
            markDirty();
          });
          var del = el("button", { class: "btn small danger", type: "button", text: "Hapus" });
          del.disabled = arr.length <= 1;
          del.addEventListener("click", function () {
            if (!confirm("Hapus item ini?")) return;
            arr.splice(i, 1);
            markDirty();
            rerender();
          });
          row.appendChild(input);
          row.appendChild(del);
          list.appendChild(row);
        });
        if (focusIndex != null && list.children[focusIndex]) {
          var el2 = list.children[focusIndex].querySelector("input");
          if (el2) el2.focus();
        }
        return;
      }

      arr.forEach(function (item, i) {
        var openAttr = arr.length <= 3 || i === focusIndex ? { open: "" } : {};
        var details = el("details", Object.assign({ class: "array-item" }, openAttr));
        var summary = el("summary", { class: "array-item-summary" });

        var thumbUrl = previewImage(item);
        if (thumbUrl) summary.appendChild(el("img", { class: "array-item-thumb", src: thumbUrl }));
        var textCol = el("div", { class: "array-item-summary-text" });
        textCol.appendChild(el("span", { class: "idx", text: "#" + (i + 1) }));
        textCol.appendChild(el("span", { class: "preview", text: truncate(previewLabel(item), 70) }));
        summary.appendChild(textCol);

        var actions = el("div", { class: "array-item-actions" });
        function stop(e, fn) {
          e.preventDefault();
          e.stopPropagation();
          fn();
        }
        var upBtn = el("button", { type: "button", title: "Naik", text: "↑" });
        upBtn.disabled = i === 0;
        upBtn.addEventListener("click", function (e) {
          stop(e, function () {
            var tmp = arr[i - 1];
            arr[i - 1] = arr[i];
            arr[i] = tmp;
            markDirty();
            rerender(i - 1);
          });
        });
        var downBtn = el("button", { type: "button", title: "Turun", text: "↓" });
        downBtn.disabled = i === arr.length - 1;
        downBtn.addEventListener("click", function (e) {
          stop(e, function () {
            var tmp = arr[i + 1];
            arr[i + 1] = arr[i];
            arr[i] = tmp;
            markDirty();
            rerender(i + 1);
          });
        });
        var delBtn = el("button", { type: "button", title: "Hapus", class: "danger-btn", text: "✕" });
        delBtn.disabled = arr.length <= 1;
        delBtn.addEventListener("click", function (e) {
          stop(e, function () {
            if (!confirm('Hapus "' + truncate(previewLabel(item), 40) + '"? Perubahan permanen setelah disimpan.')) return;
            arr.splice(i, 1);
            markDirty();
            rerender();
          });
        });
        actions.appendChild(upBtn);
        actions.appendChild(downBtn);
        actions.appendChild(delBtn);
        summary.appendChild(actions);
        details.appendChild(summary);

        var body = el("div", { class: "array-item-body" });
        Object.keys(item).forEach(function (k) {
          renderField(body, item, k, path + "." + i + "." + k, humanize(k));
        });
        details.appendChild(body);
        list.appendChild(details);
      });

      if (focusIndex != null && list.children[focusIndex]) {
        list.children[focusIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    rerender();

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var q = searchInput.value.trim().toLowerCase();
        Array.prototype.forEach.call(list.children, function (node, i) {
          var match = !q || previewLabel(arr[i]).toLowerCase().indexOf(q) !== -1;
          node.style.display = match ? "" : "none";
        });
      });
    }

    var addBtn = el("button", { class: "btn small", type: "button", text: "+ Tambah item" });
    addBtn.disabled = arr.length === 0;
    addBtn.addEventListener("click", function () {
      if (!arr.length) return;
      arr.push(blankLike(arr[arr.length - 1]));
      markDirty();
      rerender(arr.length - 1);
    });
    target.appendChild(addBtn);
  }

  /* ---------- section navigation ---------- */
  function renderSidebar() {
    var sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";
    var lastGroup = null;
    SECTIONS.forEach(function (sec) {
      if (sec.group !== lastGroup) {
        sidebar.appendChild(el("div", { class: "group-label", text: sec.group }));
        lastGroup = sec.group;
      }
      var btn = el("button", { type: "button", text: sec.label, "data-key": sec.key });
      btn.addEventListener("click", function () {
        selectSection(sec.key);
      });
      sidebar.appendChild(btn);
    });
  }

  function selectSection(key) {
    document.querySelectorAll(".sidebar button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-key") === key);
    });
    var main = document.getElementById("main");
    main.innerHTML = "";
    var sec = SECTIONS.filter(function (s) {
      return s.key === key;
    })[0];
    var header = el("div", { class: "section-header" });
    header.appendChild(el("h2", { text: sec.label }));
    main.appendChild(header);

    var value = getPath(STATE, key);
    if (!isContainer(value) || Array.isArray(value)) {
      renderField(main, STATE, key, key, sec.label);
      return;
    }

    var keys = Object.keys(value);
    var scalarKeys = keys.filter(function (k) {
      return !isContainer(value[k]);
    });
    var containerKeys = keys.filter(function (k) {
      return isContainer(value[k]);
    });

    var groups = [];
    if (scalarKeys.length) groups.push({ title: "Info Umum", keys: scalarKeys });
    containerKeys.forEach(function (k) {
      groups.push({ title: humanize(k), keys: [k] });
    });

    if (groups.length <= 1) {
      keys.forEach(function (k) {
        renderField(main, value, k, key + "." + k, humanize(k));
      });
      return;
    }

    var tools = el("div", { class: "section-tools" });
    var expandAllBtn = el("button", { type: "button", class: "btn ghost small", text: "Buka semua" });
    var collapseAllBtn = el("button", { type: "button", class: "btn ghost small", text: "Tutup semua" });
    tools.appendChild(expandAllBtn);
    tools.appendChild(collapseAllBtn);
    header.appendChild(tools);

    var jumpBar = el("div", { class: "quick-jump" });
    main.appendChild(jumpBar);

    groups.forEach(function (g, idx) {
      var details = el("details", idx === 0 ? { class: "subsection", open: "" } : { class: "subsection" });
      details.appendChild(el("summary", { text: g.title }));
      var body = el("div", { class: "subsection-body" });
      details.appendChild(body);
      main.appendChild(details);

      g.keys.forEach(function (k) {
        var childIsContainer = isContainer(value[k]);
        renderField(body, value, k, key + "." + k, humanize(k), childIsContainer && g.keys.length === 1 ? { skipBox: true } : {});
      });

      var chip = el("button", { type: "button", class: "jump-chip", text: g.title });
      chip.addEventListener("click", function () {
        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      jumpBar.appendChild(chip);
    });

    expandAllBtn.addEventListener("click", function () {
      main.querySelectorAll("details.subsection").forEach(function (d) {
        d.open = true;
      });
    });
    collapseAllBtn.addEventListener("click", function () {
      main.querySelectorAll("details.subsection").forEach(function (d) {
        d.open = false;
      });
    });
  }

  /* ---------- auth ---------- */
  function goToLogin() {
    location.href = "login.html?next=admin.html";
  }

  /* ---------- load / save ---------- */
  function load() {
    fetch("/api/content", { cache: "no-store" })
      .then(function (r) {
        if (r.status === 401) {
          goToLogin();
          return Promise.reject(new Error("unauthenticated"));
        }
        return r.json();
      })
      .then(function (data) {
        STATE = data;
        document.getElementById("status-text").textContent = "Tersimpan";
        renderSidebar();
        selectSection(SECTIONS[0].key);
      })
      .catch(function (err) {
        if (err.message === "unauthenticated") return;
        document.getElementById("status-text").textContent = "Gagal memuat data/content.json";
        toast("Gagal memuat content.json — jalankan lewat server.js, bukan file://", "error");
      });
  }

  function save() {
    var btn = document.getElementById("save-btn");
    btn.disabled = true;
    fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(STATE),
    })
      .then(function (r) {
        if (r.status === 401) {
          goToLogin();
          return Promise.reject(new Error("unauthenticated"));
        }
        return r.json();
      })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        DIRTY = false;
        document.getElementById("status-text").textContent = "Tersimpan";
        toast(
          data.deploying
            ? "Tersimpan — situs publik update dalam ~30-60 detik (redeploy otomatis)."
            : "Semua perubahan tersimpan.",
          "ok"
        );
      })
      .catch(function (err) {
        if (err.message === "unauthenticated") return;
        btn.disabled = false;
        toast("Gagal menyimpan: " + err.message, "error");
      });
  }

  function logout() {
    fetch("/api/logout", { method: "POST" }).then(function () {
      location.href = "login.html";
    });
  }

  document.getElementById("save-btn").addEventListener("click", save);
  document.getElementById("logout-btn").addEventListener("click", function () {
    if (DIRTY && !confirm("Ada perubahan belum disimpan. Keluar tanpa menyimpan?")) return;
    logout();
  });
  window.addEventListener("beforeunload", function (e) {
    if (DIRTY) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  load();
})();
