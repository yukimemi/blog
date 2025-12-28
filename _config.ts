import lume from "lume/mod.ts";
import attributes from "lume/plugins/attributes.ts";
import date from "lume/plugins/date.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import extract_date from "lume/plugins/extract_date.ts";
import base_path from "lume/plugins/base_path.ts";
import check_urls from "lume/plugins/check_urls.ts";
import feed from "lume/plugins/feed.ts";
import postcss from "lume/plugins/postcss.ts";
import paginate from "lume/plugins/paginate.ts";
import pagefind from "lume/plugins/pagefind.ts";

const site = lume({
  src: "./src",
});

site
  .use(attributes())
  .use(date())
  .use(code_highlight())
  .use(extract_date())
  .use(base_path())
  .use(check_urls({
    output: "broken-links.txt",
  }))
  .use(postcss())
  .use(paginate())
  .use(pagefind({
    ui: {
      containerId: "search",
      showImages: false,
    },
  }))
  .use(feed({
    output: ["/feed.xml", "/feed.json"],
    query: "type=post",
    info: {
      title: "yukimemi's Blog",
      description: "A blog built with Lume",
    },
    items: {
      title: "=title",
      description: "=description",
    },
  }));

site.copy("static");
site.copy("styles.css");

export default site;