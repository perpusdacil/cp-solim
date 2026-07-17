/* SOLIM Paint Specialist — shared behaviour */

(function () {
  "use strict";

  /* ----- Sticky header state ----- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----- Mobile nav ----- */
  var toggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var lockedScrollY = 0;
  function lockBodyScroll() {
    lockedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + lockedScrollY + "px";
    document.body.style.width = "100%";
  }
  function unlockBodyScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var willOpen = !document.body.classList.contains("nav-open");
      document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen) lockBodyScroll();
      else unlockBodyScroll();
    });
    /* delegated: nav links are re-rendered from content.json after load */
    if (mainNav) {
      mainNav.addEventListener("click", function (e) {
        if (e.target.closest("a") && document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
          unlockBodyScroll();
        }
      });
    }
  }

  /* ----- Reveal on scroll ----- */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("inview");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  function scanReveal() {
    document.querySelectorAll(".reveal, .capability").forEach(function (el) {
      io.observe(el);
    });
  }
  scanReveal();

  /* ----- Animated counters ----- */
  var counterIO = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        counterIO.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var dur = 1600;
        var start = performance.now();
        function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.textContent = target;
        } else {
          requestAnimationFrame(tick);
        }
      });
    },
    { threshold: 0.4 }
  );
  function scanCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      counterIO.observe(el);
    });
  }
  scanCounters();

  /* ----- Featured carousel ----- */
  var carousel = document.querySelector(".carousel");
  var carouselTrack, carouselSlides, carouselIdx, carouselTimer;
  function resyncCarousel() {
    if (!carousel) return;
    carouselTrack = carousel.querySelector(".carousel-track");
    carouselSlides = carouselTrack.children.length;
    carouselIdx = 0;
    carouselTrack.style.transform = "translateX(0)";
    carouselAuto();
  }
  function carouselGo(i) {
    carouselIdx = (i + carouselSlides) % carouselSlides;
    carouselTrack.style.transform = "translateX(-" + carouselIdx * 100 + "%)";
  }
  function carouselAuto() {
    clearInterval(carouselTimer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      carouselTimer = setInterval(function () { carouselGo(carouselIdx + 1); }, 5500);
    }
  }
  if (carousel) {
    resyncCarousel();
    document.querySelectorAll("[data-carousel-prev]").forEach(function (b) {
      b.addEventListener("click", function () { carouselGo(carouselIdx - 1); carouselAuto(); });
    });
    document.querySelectorAll("[data-carousel-next]").forEach(function (b) {
      b.addEventListener("click", function () { carouselGo(carouselIdx + 1); carouselAuto(); });
    });
  }

  /* ----- Re-sync behaviours after dynamic content.json render ----- */
  document.addEventListener("solim:content-ready", function () {
    scanReveal();
    scanCounters();
    resyncCarousel();
  });

  /* ----- Portfolio filter ----- */
  var filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      filterBar.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var f = btn.getAttribute("data-filter");
      document.querySelectorAll(".project-card[data-sector]").forEach(function (card) {
        var show = f === "all" || card.getAttribute("data-sector") === f;
        card.classList.toggle("hidden", !show);
      });
    });
  }

  /* ----- RFP modal ----- */
  var rfpModal = document.getElementById("rfp-modal");
  function openModal(m) {
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(m) {
    m.classList.remove("open");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-open-rfp]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (rfpModal) {
        e.preventDefault();
        openModal(rfpModal);
      }
    });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.closest(".modal-close")) closeModal(m);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.open").forEach(closeModal);
    }
  });

  /* ----- RFP / contact form submit (mock — hubungkan ke backend/API di produksi) ----- */
  document.querySelectorAll("form[data-rfp]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = form.parentElement.querySelector(".success");
      form.style.display = "none";
      if (success) success.style.display = "block";
    });
  });

  /* ----- Dropzone label ----- */
  document.querySelectorAll(".dropzone").forEach(function (dz) {
    var input = dz.querySelector("input[type=file]");
    if (!input) return;
    dz.addEventListener("click", function () { input.click(); });
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("drag"); });
    });
    input.addEventListener("change", function () {
      if (input.files.length) {
        dz.querySelector("p").textContent = input.files.length + " file dipilih";
      }
    });
  });

  /* ----- Newsletter (mock) ----- */
  document.querySelectorAll(".newsletter").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      f.innerHTML = '<p style="font-size:0.85rem;color:#b89a6e;">Terima kasih — Anda sudah terdaftar.</p>';
    });
  });
})();
