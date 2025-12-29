---
title: Add event option for plugpac.vim
date: 2020-05-16T21:57:00+09:00
draft: false
tags:
  - vim
  - neovim
  - plugpac
layout: layouts/post.vto
type: post
description: "`plugpac.vim`に`event`オプションを追加し、`CursorHold`などのイベント発生時にプラグインを遅延ロードできるようにした更新情報です。"
---


[以前の記事](https://yukimemi.netlify.app/add-lazyall-option-for-plugpac-vim/) で記載した、 [plugpac](https://github.com/yukimemi/plugpac.vim) 。
非常に便利に使っているが、 [dein](https://github.com/Shougo/dein.vim) にあるような、 `event` による遅延ロードもあったらいいなと思ったので追加した。

<!-- more -->

記載方法はこんな感じ。

```vim
" Plugins: {{{1
Pack 'RRethy/vim-illuminate', {'type': 'opt', 'event': ['CursorHold', 'CursorMoved']}
Pack 'airblade/vim-rooter', {'type': 'opt', 'event': 'BufEnter'}
Pack 'honza/vim-snippets', {'type': 'opt', 'event': 'InsertEnter'}
Pack 'itchyny/vim-cursorword', {'type': 'opt', 'event': ['CursorHold', 'CursorMoved']}
Pack 'itchyny/vim-highlighturl', {'type': 'opt', 'event': 'CursorHold'}
Pack 'itchyny/vim-parenmatch', {'type': 'opt', 'event': 'CursorHold'}
Pack 'ntpeters/vim-better-whitespace', {'type': 'opt', 'event': 'CursorHold'}
Pack 'tyru/caw.vim', {'type': 'opt', 'event': 'CursorMoved'}
Pack 'unblevable/quick-scope', {'type': 'opt', 'event': 'CursorHold'}
Pack 'vim-scripts/autodate.vim', {'type': 'opt', 'event': 'InsertEnter'}
```

けっこういろいろ、 `event` 指定で遅延ロードできるなぁと。
べんり。

## 参考

[yukimemi/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/yukimemi/plugpac.vim)
[yukimemi/dotfiles: my conf settings](https://github.com/yukimemi/dotfiles)

