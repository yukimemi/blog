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
})();
