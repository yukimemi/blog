---
title: tmuxで一時的にpaneを最大化する
date: 2014-06-01
draft: false
tags:
  - tmux
layout: layouts/post.vto
type: post
---


知らんかった。便利

tmux 1.8 以降だと、 `prefix z` で最大化をトグルできるみたい。

[tmux で一時的に pane を最大化する - sorry, uninuplemented:](http://rhysd.hatenablog.com/entry/2013/09/16/003620)

ちなみに、vimでは、以下のような設定で似たようなことも出来るみたい。
```vim
nnoremap so <C-w>_<C-w>|
```
<!-- more -->

2個目の `<C-w>` と `|` の間には、 `<C-v>` があり。( `<C-v>` を2回入力する)

トグルではないけど。

