// Progressive enhancement for the paginated home page: appends the next page's
// posts as the sentinel scrolls into view, and restores the already-loaded pages
// when navigating back. Extracted verbatim from the previous Lume template.
(function () {
  const postList = document.getElementById("post-list");
  const sentinel = document.getElementById("infinite-scroll-sentinel");
  let nextLink = document.getElementById("next-page-link");
  const STORAGE_KEY = "blog_infinite_scroll_state";

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
      if (sentinel) sentinel.style.visibility = "visible";

      for (const url of loadedUrls) {
        try {
          const response = await fetch(url);
          const html = await response.text();
          appendPosts(html);
        } catch (e) {
          console.error("Failed to restore page:", url, e);
        }
      }

      if (sentinel && nextLink) sentinel.style.visibility = "hidden";
    }

    if (sentinel && nextLink) {
      const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting) {
          const url = nextLink.href;
          if (!url) return;

          sentinel.style.visibility = "visible";

          try {
            const response = await fetch(url);
            const html = await response.text();

            loadedUrls.push(url);
            saveState(loadedUrls);

            const hasMore = appendPosts(html);

            if (!hasMore) {
              observer.disconnect();
            } else {
              sentinel.style.visibility = "hidden";
            }
          } catch (e) {
            console.error("Failed to load next page:", e);
            sentinel.style.visibility = "hidden";
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
