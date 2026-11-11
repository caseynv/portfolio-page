// Privacy-first, opt-in anonymous portfolio analytics.
// No cookies, fingerprinting, IP capture, or cross-tab identity.
(() => {
  if (location.pathname.endsWith("/analytics-admin.html")) return;
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;
  const preferenceKey = "portfolio-analytics-consent-v1";
  const consent = localStorage.getItem(preferenceKey);
  const send = (type, target = "") => {
    if (localStorage.getItem(preferenceKey) !== "yes") return;
    let session = sessionStorage.getItem("portfolio-analytics-session");
    if (!session) {
      session = crypto.randomUUID();
      sessionStorage.setItem("portfolio-analytics-session", session);
    }
    const payload = JSON.stringify({
      session, type, target,
      page: location.pathname.replace(/[^a-zA-Z0-9/._-]/g, "").slice(0, 120),
      project: location.pathname.endsWith("case-study.html")
        ? new URLSearchParams(location.search).get("id")?.slice(0, 64) || "" : "",
      source: (() => {
        try {
          const url = new URL(document.referrer);
          return url.hostname === location.hostname ? "internal" : url.hostname.slice(0, 100);
        } catch { return "direct"; }
      })()
    });
    fetch("/.netlify/functions/portfolio-events", {
      method: "POST", headers: { "content-type": "application/json" },
      body: payload, keepalive: true, credentials: "omit"
    }).catch(() => {});
  };
  function start() {
    if (sessionStorage.getItem("portfolio-analytics-page") !== location.href) {
      send("page_view");
      sessionStorage.setItem("portfolio-analytics-page", location.href);
    }
  }
  if (consent === "yes") start();
  if (consent === null) {
    const panel = document.createElement("div");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Optional analytics");
    panel.style.cssText = "position:fixed;z-index:9999;bottom:16px;left:16px;right:16px;max-width:490px;padding:18px;background:#18233a;color:#fff;border:1px solid #63708c;border-radius:12px;box-shadow:0 8px 40px #0005;font:14px/1.5 system-ui";
    const message = document.createElement("p");
    message.textContent = "May I collect anonymous page visits and portfolio clicks to improve this site? Optional; no IP storage or tracking across sites.";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:12px;justify-content:flex-end;margin-top:10px";
    for (const [label, value] of [["Decline", "no"], ["Allow analytics", "yes"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText = "cursor:pointer;padding:8px 12px;border-radius:7px;border:1px solid #8999b4;background:" + (value === "yes" ? "#e4eefc;color:#14213a" : "transparent;color:#fff");
      button.addEventListener("click", () => {
        localStorage.setItem(preferenceKey, value);
        panel.remove();
        if (value === "yes") start();
      });
      actions.append(button);
    }
    panel.append(message, actions);
    document.body.append(panel);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || localStorage.getItem(preferenceKey) !== "yes") return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.pathname.toLowerCase().endsWith(".pdf") && url.pathname.includes("/resume/")) send("resume_click");
    else if (url.protocol === "mailto:" || url.hash === "#contact") send("contact_click");
    else if (url.hostname === "www.linkedin.com" && url.pathname.startsWith("/in/")) send("social_click", "linkedin");
  });
})();
