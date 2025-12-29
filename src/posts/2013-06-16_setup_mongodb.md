---
title: Mac OSX Mountain Lion MongoDB セットアップ
date: 2013-06-16
draft: false
tags:
  - mongodb
  - mac
layout: layouts/post.vto
type: post
description: "Mac OSX Mountain LionにHomebrewを使ってMongoDBをインストールし、自動起動設定を行う手順をまとめました。"
---


mongodb をいれてみた。

```bash
$ brew install mongodb
```
<!-- more -->

これでインストール完了。簡単。

自動起動する設定も書いてあるからそれを実行するだけ。

```bash
$ ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
$ launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist
```

これで自動起動される。

手動で起動するには、次のようにする。

```bash
$ launchctl start homebrew.mxcl.mongodb
```

