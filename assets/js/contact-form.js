"use strict";

/**
 * Contact form — validation, sanitisation, honeypot + time-based bot checks.
 * Submits to data-endpoint (Formspree JSON) or mailto fallback.
 * Never renders user input with innerHTML.
 */
(function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const toast = form.querySelector("[data-contact-toast]");
  const typeInput = form.querySelector("#contact-type");
  const typePills = [...form.querySelectorAll(".contact-type-pill")];
  const submitBtn = form.querySelector('button[type="submit"]');
  const mailto = form.dataset.mailto || "sharifuzofc@gmail.com";
  const honeypot = form.querySelector("#contact-company");
  const loadedAtInput = form.querySelector("#contact-loaded-at");
  const MIN_MS = 3000;
  const MAX_NAME = 120;
  const MAX_EMAIL = 254;
  const MAX_MESSAGE = 5000;

  if (loadedAtInput) {
    loadedAtInput.value = String(Date.now());
  }

  /** Strip control chars / HTML angle brackets from free text */
  function sanitise(value, maxLen) {
    return String(value || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, maxLen);
  }

  const fields = {
    name: {
      el: form.querySelector("#contact-name"),
      error: form.querySelector("#contact-name-error"),
      validate(v) {
        const s = sanitise(v, MAX_NAME);
        if (!s) return "Please enter your name.";
        if (s.length < 2) return "Name is too short.";
        return "";
      },
    },
    email: {
      el: form.querySelector("#contact-email"),
      error: form.querySelector("#contact-email-error"),
      validate(v) {
        const s = sanitise(v, MAX_EMAIL);
        if (!s) return "Please enter your email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
          return "Enter a valid email address.";
        }
        return "";
      },
    },
    message: {
      el: form.querySelector("#contact-message"),
      error: form.querySelector("#contact-message-error"),
      validate(v) {
        const s = sanitise(v, MAX_MESSAGE);
        if (!s) return "Tell me a bit about what you’re building.";
        if (s.length < 12) return "A little more detail helps — 12+ characters.";
        return "";
      },
    },
    type: {
      el: typeInput,
      error: form.querySelector("#contact-type-error"),
      validate(v) {
        if (!v) return "Pick a project type.";
        return "";
      },
    },
  };

  function showError(field, msg) {
    const { el, error } = field;
    if (!el || !error) return;
    if (msg) {
      error.textContent = msg;
      error.hidden = false;
      el.classList?.add("is-invalid");
      el.setAttribute?.("aria-invalid", "true");
    } else {
      error.textContent = "";
      error.hidden = true;
      el.classList?.remove("is-invalid");
      el.removeAttribute?.("aria-invalid");
    }
  }

  function validateAll() {
    let firstInvalid = null;
    let ok = true;

    Object.values(fields).forEach((field) => {
      if (!field.el) return;
      const value = field.el.value || "";
      const msg = field.validate(value);
      showError(field, msg);
      if (msg) {
        ok = false;
        if (!firstInvalid) firstInvalid = field.el;
      }
    });

    return { ok, firstInvalid };
  }

  function showToast(message, isError) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("is-error", !!isError);
    toast.hidden = false;
  }

  function hideToast() {
    if (!toast) return;
    toast.hidden = true;
    toast.textContent = "";
    toast.classList.remove("is-error");
  }

  /** Silent success for bots — do not tip them off */
  function botTrapTriggered() {
    if (honeypot && honeypot.value.trim() !== "") return true;
    const loaded = Number(loadedAtInput?.value || 0);
    if (!loaded || Date.now() - loaded < MIN_MS) return true;
    return false;
  }

  typePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const type = pill.dataset.type || "";
      typePills.forEach((p) => {
        const on = p === pill;
        p.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (typeInput) typeInput.value = type;
      showError(fields.type, "");
      hideToast();
    });
  });

  Object.values(fields).forEach((field) => {
    if (!field.el || field.el.type === "hidden") return;
    field.el.addEventListener("input", () => {
      const dirty =
        field.el.classList.contains("is-invalid") ||
        (field.error && !field.error.hidden);
      if (!dirty) return;
      showError(field, field.validate(field.el.value || ""));
    });
  });

  function mailtoFallback(data) {
    const subject = encodeURIComponent(
      `Project inquiry — ${data.project_type || "general"}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Type: ${data.project_type || "—"}`,
        "",
        data.message,
      ].join("\n")
    );
    window.location.href = `mailto:${mailto}?subject=${subject}&body=${body}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideToast();

    if (botTrapTriggered()) {
      showToast("Sent — I’ll reply within 24h ✓", false);
      form.reset();
      if (loadedAtInput) loadedAtInput.value = String(Date.now());
      return;
    }

    const { ok, firstInvalid } = validateAll();
    if (!ok) {
      if (firstInvalid === typeInput) {
        typePills[0]?.focus({ preventScroll: false });
      } else if (firstInvalid && typeof firstInvalid.focus === "function") {
        firstInvalid.focus({ preventScroll: false });
      }
      return;
    }

    const data = {
      name: sanitise(fields.name.el.value, MAX_NAME),
      email: sanitise(fields.email.el.value, MAX_EMAIL),
      message: sanitise(fields.message.el.value, MAX_MESSAGE),
      project_type: typeInput?.value || "",
    };

    const endpoint = (form.dataset.endpoint || "").trim();

    if (!endpoint) {
      showToast("Opening email — I’ll reply within 24h ✓", false);
      mailtoFallback(data);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.reset();
      typePills.forEach((p) => p.setAttribute("aria-pressed", "false"));
      if (typeInput) typeInput.value = "";
      if (loadedAtInput) loadedAtInput.value = String(Date.now());
      Object.values(fields).forEach((f) => showError(f, ""));
      showToast("Sent — I’ll reply within 24h ✓", false);
    } catch {
      showToast(
        "Couldn’t send — try email instead, or check the form endpoint.",
        true
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
})();
