// Fills in the statusline's position segment, the one part of it that cannot be
// rendered at build time. Everything else is emitted by the templates, so the
// bar is complete and accurate without JavaScript -- this only adds the ruler.
//
// Reports what Vim's ruler reports: Top / Bot / All when the whole buffer is
// visible or you are at an edge, and a percentage in between. That is more
// useful than a raw percentage, which never reaches 100 and never says "there
// is nothing more to read".
(function () {
  const pos = document.querySelector("[data-pos]");
  if (!pos) return;

  const read = () => {
    const doc = document.documentElement;
    const scrolled = window.scrollY;
    const viewport = window.innerHeight;
    const total = doc.scrollHeight;
    const scrollable = total - viewport;

    if (scrollable <= 1) return "All";
    if (scrolled <= 1) return "Top";
    if (scrolled >= scrollable - 1) return "Bot";

    // Clamped to 1..99 because Vim's ruler has no 0% or 100%: those two states
    // are spelled Top and Bot, and printing them as percentages says the
    // opposite of what the reader can see. Unclamped, a 14000px post read
    // "0%" two pixels below the top and "100%" two pixels above the bottom.
    const pct = Math.round((scrolled / scrollable) * 100);
    return Math.min(99, Math.max(1, pct)) + "%";
  };

  let queued = false;
  const update = () => {
    queued = false;
    const next = read();
    if (pos.textContent !== next) pos.textContent = next;
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  update();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });

  // The ruler is a function of document height, and plenty of things change
  // that after this script has run without firing a scroll or resize event:
  // infinite scroll appending posts and then removing the paginator, hljs
  // rewrapping every code block, images and the three webfonts landing. A
  // ResizeObserver on <body> catches all of them, which a MutationObserver on
  // the post list -- the previous approach -- did not. The statusline itself is
  // position: fixed, so writing to it cannot feed back into body height.
  if ("ResizeObserver" in window) {
    new ResizeObserver(schedule).observe(document.body);
  }

  // `:set background=…` — the reader's override of the OS scheme.
  //
  // Three states, not two: once someone has picked light or dark they are
  // overriding their own OS for good, so "auto" has to stay reachable. The
  // button is inert markup until here, so a reader without scripting is never
  // offered a control that cannot work.
  const toggle = document.querySelector("[data-bg-toggle]");
  if (!toggle) return;

  const ORDER = ["auto", "light", "dark"];
  const root = document.documentElement;

  const stored = () => {
    try {
      const v = localStorage.getItem("bg");
      return v === "light" || v === "dark" ? v : "auto";
    } catch (e) {
      return "auto";
    }
  };

  const paint = (mode) => {
    if (mode === "auto") root.removeAttribute("data-bg");
    else root.setAttribute("data-bg", mode);

    toggle.textContent = "bg=" + mode;
    // The label already reads "bg=dark"; the accessible name says what pressing
    // it will do, which the label does not.
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    toggle.setAttribute("aria-label", "配色: " + mode + "。押すと " + next + " に切り替わります");
  };

  let mode = stored();
  paint(mode);
  toggle.hidden = false;

  toggle.addEventListener("click", () => {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try {
      if (mode === "auto") localStorage.removeItem("bg");
      else localStorage.setItem("bg", mode);
    } catch (e) {
      // Private browsing and similar. The choice still applies to this page.
    }
    paint(mode);
  });

  // No matchMedia listener here on purpose. Following the OS while on "auto"
  // is the media query's job and it re-evaluates on its own; the label reads
  // "bg=auto" either way, so there is nothing left for JS to update.
})();
