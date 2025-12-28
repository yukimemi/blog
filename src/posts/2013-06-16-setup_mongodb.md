---
title: Mac OSX Mountain Lion MongoDB セットアップ
date: 2013-06-16
draft: false
tags:
  - mongodb
  - mac
layout: layouts/post.vto
type: post
---


mongodb をいれてみた。

```sh
$ brew install mongodb
```
<!-- more -->

これでインストール完了。簡単。

自動起動する設定も書いてあるからそれを実行するだけ。

```sh
$ ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
$ launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist
```

これで自動起動される。

手動で起動するには、次のようにする。

```sh
$ launchctl start homebrew.mxcl.mongodb
```

