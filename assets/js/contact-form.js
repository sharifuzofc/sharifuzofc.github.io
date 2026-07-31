"use strict";

/**
 * Contact form — custom validation, Formspree endpoint or mailto fallback.
 */
(function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const toast = form.querySelector("[data-contact-toast]");
  const typeInput = form.querySelector("#contact-type");
  const typePills = [...form.querySelectorAll(".contact-type-pill")];
  const submitBtn = form.querySelector('button[type="submit"]');
  const mailto = form.dataset.mailto || "sharifuzofc@gmail.com";

  const fields = {
    name: {
      el: form.querySelector("#contact-name"),
      error: form.querySelector("#contact-name-error"),
      validate(v) {
        if (!v.trim()) return "Please enter your name.";
        return "";
      },
    },
    email: {
      el: form.querySelector("#contact-email"),
      error: form.querySelector("#contact-email-error"),
      validate(v) {
        if (!v.trim()) return "Please enter your email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
          return "Enter a valid email address.";
        }
        return "";
      },
    },
    message: {
      el: form.querySelector("#contact-message"),
      error: form.querySelector("#contact-message-error"),
      validate(v) {
        if (!v.trim()) return "Tell me a bit about what you’re building.";
        if (v.trim().length < 12) return "A little more detail helps — 12+ characters.";
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
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      message: fields.message.el.value.trim(),
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
      Object.values(fields).forEach((f) => showError(f, ""));
      showToast("Sent — I’ll reply within 24h ✓", false);
    } catch {
      showToast("Couldn’t send — try email instead, or check the form endpoint.", true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
})();
