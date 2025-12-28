export const layout = "layouts/base.vto";

export default function* ({ search }: Lume.Data) {
  // すべてのタグを取得し、小文字にして重複を除去
  const allTags = search.values("tags");
  const uniqueTags = Array.from(new Set(allTags.map(t => String(t).toLowerCase())));

  // 各タグごとにページを生成
  for (const tag of uniqueTags) {
    yield {
      url: `/tags/${tag}/`,
      title: `Tagged: ${tag}`,
      content: `
        <h1>Tagged: ${tag}</h1>
        <ul class="post-list">
          ${search.pages(`tags*=${tag}`).map((post) => `
            <li>
              <a href="${post.url}">${post.title}</a>
              <time datetime="${post.date}">${post.date?.toLocaleDateString()}</time>
            </li>
          `).join("")}
        </ul>
        <p><a href="/tags/">All Tags</a></p>
      `,
    };
  }
}