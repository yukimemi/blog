export const layout = "layouts/base.vto";

export default function* ({ search }: Lume.Data) {
  // Get all tags, convert to lowercase, and remove duplicates
  const tags = search.values("tags").map((tag) => tag.toLowerCase()).filter((
    value,
    index,
    self,
  ) => self.indexOf(value) === index);

  // Generate a page for each tag
  for (const tag of tags) {
    yield {
      url: `/tags/${tag}/`,
      title: `Tagged: ${tag}`,
      content: `
        <h1>Tagged: ${tag}</h1>
        <ul class="post-list">
          ${
        search.pages(`tags*=${tag}`).map((post) => `
            <li>
              <a href="${post.url}">${post.title}</a>
              <time datetime="${post.date}">${post.date?.toLocaleDateString()}</time>
            </li>
          `).join("")
      }
        </ul>
        <p><a href="/tags/">All Tags</a></p>
      `,
    };
  }
}
