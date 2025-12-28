---
title: vimperator colorscheme
date: 2015-03-02T02:00:14+09:00
draft: false
tags:
  - vimperator
  - colorscheme
layout: layouts/post.vto
type: post
---


vimperatorでcolorschemeを使う方法。

自分で作ってもいいけど、大変なので・・・


### リポジトリクローン
`ghq` については、[この記事](/posts/All You Need Is Peco/)で。
```bash
$ ghq get https://github.com/vimpr/vimperator-colors.git
```
<!-- more -->

### シンボリックリンク
```bash
$ ln -sfn ~/.ghq/src/github.com/vimpr/vimperator-colors ~/.vimperator/colors
```

### .vimperatorrc編集
```vim
colorscheme sweets_snaka
```

かっこいい！！

- - -

##### 参考:
[vimpr/vimperator-colors](https://github.com/vimpr/vimperator-colors)
