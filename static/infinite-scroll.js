// Progressive enhancement for the paginated home page: appends the next page's
// posts as the sentinel scrolls into view, and restores the already-loaded pages
// when navigating back. Extracted from the previous Lume template.
//
// The paginator link is no longer the thing that gets hidden. It used to sit
// inside `visibility: hidden`, which meant the only link to page 2 on the site
// was absent from the tab order and the accessibility tree -- with JavaScript
// off, or with a keyboard and no pointer, the archive ended at ten posts. The
// link now stays visible and this script only retargets its href as it appends
// pages, removing it when the last page has been loaded. What gets shown and
// hidden instead is the loading line, which is the only part that is genuinely
// transient.
(function () {
  const postList = document.getElementById("post-list");
  const sentinel = document.getElementById("infinite-scroll-sentinel");
  let nextLink = document.getElementById("next-page-link");
  const spinner = sentinel && sentinel.querySelector(".loading-spinner");
  const STORAGE_KEY = "blog_infinite_scroll_state";

  // `hidden` rather than a style write: it keeps the line out of the
  // accessibility tree between fetches, so its role="status" announces the
  // append once instead of sitting there permanently.
  const loading = (on) => {
    if (spinner) spinner.hidden = !on;
  };

  const getState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      return (state && state.path === window.location.pathname) ? state : null;
    } catch {
      return null;
    }
  };

  const saveState = (urls) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      path: window.location.pathname,
      urls: urls,
    }));
  };

  const state = getState();
  let loadedUrls = state ? state.urls : [];

  if (!state) {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  const appendPosts = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newPosts = doc.querySelectorAll("#post-list .post-item");
    newPosts.forEach((post) => postList.appendChild(post));

    const newNextLink = doc.getElementById("next-page-link");
    if (newNextLink && nextLink) {
      nextLink.href = newNextLink.href;
      return newNextLink.href;
    } else {
      nextLink = null;
      if (sentinel) sentinel.remove();
      return null;
    }
  };

  const init = async () => {
    if (loadedUrls.length > 0 && nextLink) {
      loading(true);

      for (const url of loadedUrls) {
        try {
          const response = await fetch(url);
          const html = await response.text();
          appendPosts(html);
        } catch (e) {
          console.error("Failed to restore page:", url, e);
        }
      }

      loading(false);
    }

    if (sentinel && nextLink) {
      const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting) {
          const url = nextLink.href;
          if (!url) return;

          loading(true);

          try {
            const response = await fetch(url);
            const html = await response.text();

            loadedUrls.push(url);
            saveState(loadedUrls);

            const hasMore = appendPosts(html);

            if (!hasMore) {
              observer.disconnect();
            }
            loading(false);
          } catch (e) {
            console.error("Failed to load next page:", e);
            loading(false);
          }
        }
      }, {
        rootMargin: "400px",
      });

      observer.observe(sentinel);
    }
  };

  if (postList) init();
})();
