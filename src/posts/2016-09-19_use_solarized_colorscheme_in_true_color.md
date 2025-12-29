---
title: Use solarized colorscheme in true color
date: 2016-09-19T11:15:50+09:00
draft: false
tags:
  - vim
  - solarized
  - colorscheme
layout: layouts/post.vto
type: post
description: "True Color環境下でSolarizedカラースキームを使用する際、通常のプラグインではなく`vim-solarized8`を使用することで解決した話です。"
---


前回の記事([True color in iTerm2 Tmux Neovim | YUKIMEMI](http://yukimemi.github.io/post/2016-09-19_True%20color%20in%20iTerm2%20Tmux%20Neovim/))で、 `iterm` と `neovim` でtrue colorを使う方法はわかったんだけど、なぜか、 `solarized` の `colorscheme` が有効にならなかった。


通常の `solarized` ではダメなようで、true color対応したやつを使えばいいみたい。

```toml
[[plugins]]
repo = 'lifepillar/vim-solarized8'
```
<!-- more -->
```vim
colorscheme solarized8_dark
```

これでできた。

- - -
##### 参考

[tmux on iTerm2 で斜体 & True Color を使う - Qiita](http://qiita.com/delphinus35/items/b8c1a8d3af9bbacb85b8)

