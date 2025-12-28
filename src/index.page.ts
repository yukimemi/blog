export const layout = "layouts/base.vto";

export default function* ({ search, paginate }: Lume.Data) {
  const posts = search.pages("type=post", "date=desc");

  // デバッグ用: コンソールに全記事数とタイトルを表示
  console.log(`Total posts found: ${posts.length}`);
  // posts.forEach(p => console.log(`- ${p.title} (${p.date})` ));

  const options = {
    size: 10,
    url: (n: number) => (n === 1 ? "/" : `/page/${n}/`),
  };

  for (const page of paginate(posts, options)) {
    yield {
      title: page.pagination.page === 1
        ? "Home"
        : `Page ${page.pagination.page}`,
      url: page.url,
      posts: page.results,
      pagination: page.pagination,
      content: `
<section>
  <div class="hero" style="padding: 4rem 0; text-align: center;">
    <h2 style="font-size: 3rem; margin-bottom: 1rem;">Welcome to my blog</h2>
    <p style="font-size: 1.25rem; color: var(--accents-7);">Thoughts, code, and life.</p>
  </div>

  <ul id="post-list" class="post-list">
    ${
        page.results.map((post) => `
      <li class="post-item">
        <h3><a href="${post.url}">${post.title}</a></h3>
        <div class="post-meta">
          <time datetime="${post.date?.toISOString()}">${
          post.date?.toLocaleDateString("ja-JP")
        }</time>
        </div>
        <p>${post.description || ""}</p>
      </li>
    `).join("")
      }
  </ul>

  ${
        page.pagination.next
          ? `
    <div id="infinite-scroll-sentinel" style="text-align: center; padding: 2rem; visibility: hidden;">
      <a id="next-page-link" href="${page.pagination.next}">Next Page</a>
      <div class="loading-spinner">Loading more posts...</div>
    </div>
  `
          : ""
      }
</section>

<script>
  (function() {
    const postList = document.getElementById("post-list");
    const sentinel = document.getElementById("infinite-scroll-sentinel");
    const nextLink = document.getElementById("next-page-link");

    if (sentinel && nextLink) {
      const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting) {
          const url = nextLink.href;
          if (!url) return;

          sentinel.style.visibility = "visible";
          
          try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            const newPosts = doc.querySelectorAll("#post-list .post-item");
            newPosts.forEach(post => postList.appendChild(post));
            
            const newNextLink = doc.getElementById("next-page-link");
            if (newNextLink) {
              nextLink.href = newNextLink.href;
              sentinel.style.visibility = "hidden";
            } else {
              sentinel.remove();
              observer.disconnect();
            }
          } catch (e) {
            console.error("Failed to load next page:", e);
          }
        }
      }, {
        rootMargin: "400px",
      });

      observer.observe(sentinel);
    }
  })();
</script>
      `,
    };
  }
}
