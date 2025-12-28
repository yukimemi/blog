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
    let nextLink = document.getElementById("next-page-link");
    const STORAGE_KEY = "blog_infinite_scroll_state";

    // 状態の取得
    const getState = () => {
      try {
        const state = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        return (state && state.path === window.location.pathname) ? state : null;
      } catch {
        return null;
      }
    };
    
    // 状態の保存
    const saveState = (urls) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        path: window.location.pathname,
        urls: urls
      }));
    };

    // 初期状態のロード
    const state = getState();
    let loadedUrls = state ? state.urls : [];

    // もしパスが変わっていたらクリア
    if (!state) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    // HTMLから記事を抽出して追加する関数
    const appendPosts = (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newPosts = doc.querySelectorAll("#post-list .post-item");
      newPosts.forEach(post => postList.appendChild(post));
      
      const newNextLink = doc.getElementById("next-page-link");
      if (newNextLink && nextLink) {
        nextLink.href = newNextLink.href;
        return newNextLink.href; // 次のURLがある場合
      } else {
        nextLink = null;
        if (sentinel) sentinel.remove();
        return null;
      }
    };

    // 初期化と復元処理
    const init = async () => {
      // 復元処理
      if (loadedUrls.length > 0 && nextLink) {
        if (sentinel) sentinel.style.visibility = "visible";
        
        // 順番に読み込んでDOMを復元
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

      // IntersectionObserver の設定
      if (sentinel && nextLink) {
        const observer = new IntersectionObserver(async (entries) => {
          if (entries[0].isIntersecting) {
            const url = nextLink.href;
            if (!url) return;

            sentinel.style.visibility = "visible";
            
            try {
              const response = await fetch(url);
              const html = await response.text();
              
              // 読み込み成功したらリストに追加して保存
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

    init();
  })();
</script>
      `,
    };
  }
}
