---
title: tmuxで画面サイズをリセットしてアタッチ
date: 2013-06-16
draft: false
tags:
  - tmux
layout: layouts/post.vto
type: post
description: "tmuxでアタッチする際、画面サイズの問題を防ぐために既存のセッションをデタッチしてからアタッチする方法です。.zshrcの設定例も紹介しています。"
---


tmux で attach する場合、事前に attach されていた
画面がある時、その画面サイズに固定されてしまう。

そのため、 attach する前にオプションで detach させるようにする。

zsh で自動 attach するには、 .zshrc にこんな感じで書いてる。

```bash
if [ -z $TMUX ]; then
  tmux attach -d || tmux
fi
```
<!-- more -->

##### 参考:

[tmuxでアタッチした時、画面がおかしくなるのを直した \#tmux - Qiita [キータ]](http://qiita.com/items/fa28ae844bc820c2da57)

[Tmuxの設定とメモ](http://filmlang.org/computer/tmux)
