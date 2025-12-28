---
title: roots new post command
date: 2014-06-26
draft: false
tags:
  - roots
  - nodejs
  - javascript
  - shell
layout: layouts/post.vto
type: post
---


Tinkererでは、 `tinker -p "hogehoge"` で、新しい記事を作成することが出来た。
roots でも同じことがしたかったので、コマンドを作ってみた。

+++

<!-- more -->
```bash
#!/bin/bash

# posts dir
postsDir=posts

# title
echo -n "title: "
read title

postFile=${postsDir}/$(date +%Y-%m-%d)_${title}.jade

cat << EOT >> "${postFile}"
+++
title = "${title}"
date: "2019-04-14T10:24:17+09:00"
layout: ../views/_single_post.jade
+++

:markdown


// vim: ft=markdown
EOT
```

これを `pn` というファイル名でpathの通った場所に保存すると、

```bash
$ pn
title = "hogehoge"
```

とプロンプトが表示され、タイトルを打ち込むことで新しいブログ記事を作成出来る。
便利。

