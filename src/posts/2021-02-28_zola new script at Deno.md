---
title: zola new script at Deno
date: 2021-02-28T12:17:06+09:00
draft: false
tags:
  - deno
  - zola
layout: layouts/post.vto
type: post
---


このブログは [Zola](https://www.getzola.org/) 使ってるんだけど、 [Zola](https://www.getzola.org/) では新しい記事追加のコマンドは提供されていない。

そこで、今流行りの [Deno](https://deno.land/) を使用して新規記事を追加するスクリプトを書いてみた。
こういうのサクッと作れるのすごい。

<!-- more -->

## Deno install

[Deno](https://deno.land/) のインストールは公式にあるように、 curl で簡単に。

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

`PATH` は自分で追加する。

- .zshenv

```zsh
# deno.
export DENO_INSTALL=$HOME/.deno

path=(
  $DENO_INSTALL/bin(N-/)

  $path
)
```

## zola-new コマンド

新規スクリプトとして、 `zola-new` を作成してみる。

```bash
vim zola-new.ts
```

- zola-new.ts

```typescript
import { formatISO } from "https://deno.land/x/date_fns/index.js";
import * as color from "https://deno.land/std/fmt/colors.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const input = async (): Promise<string> => {
  const title = await prompt("Enter new post title:");
  if (title === null) {
    return input();
  }
  return title;
};

const title = await input();
console.log(color.cyan(title));

const base = "./content";
const today = formatISO(new Date(), { representation: "date" });
const todayIso = formatISO(new Date(), {});
const post = path.join(base, `${today}_${title}.md`);

console.log(color.green(`Create new post: '${post}'`));

await Deno.writeTextFile(
  post,
  `+++
title = "${title}"
date = ${todayIso}
draft = true
[taxonomies]
tags = []
+++


<!-- more -->
`
);
```

これをコンパイルする。

```bash
deno compile --unstable --allow-write zola-new.ts
```

`zola-new` ファイルができているので、これを `PATH` の通った場所にコピー。

```bash
cp zola-new ~/.deno/bin/
```

これで、 `zola-new` コマンドが使えるようになる。
こんな感じ。

```bash
❯ zola-new
Enter new post title: New post !!
New post !!
Create new post: 'content/2021-02-28_New post !!.md'
```

べんり。

ちなみに、上記スクリプトは github に push してるので、以下のように URL からもインストールできるみたい。

```bash
deno install --allow-write https://raw.githubusercontent.com/yukimemi/deno-scripts/master/zola-new.ts
```

すごい！！！
