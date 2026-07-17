/* Solim Paint Specialist — admin login */
(function () {
  "use strict";

  var form = document.getElementById("login-form");
  var errorBox = document.getElementById("login-error");
  var submitBtn = document.getElementById("login-submit");
  var passwordInput = document.getElementById("login-password");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add("show");
  }

  function nextUrl() {
    var params = new URLSearchParams(location.search);
    var next = params.get("next");
    return next && next.indexOf("/") !== 0 && next.indexOf("//") !== 0 ? next : "admin.html";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.classList.remove("show");
    submitBtn.disabled = true;
    submitBtn.textContent = "Memeriksa…";

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { status: r.status, data: data };
        });
      })
      .then(function (res) {
        if (res.status !== 200) throw new Error(res.data.error || "Gagal masuk");
        location.href = nextUrl();
      })
      .catch(function (err) {
        showError(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Masuk";
        passwordInput.value = "";
        passwordInput.focus();
      });
  });
})();
