---
title: PalmDetect in Ubuntu
date: 2015-05-10T08:57:44+09:00
draft: false
tags:
  - ubuntu
  - synclient
  - palmdetect
  - trackpad
layout: layouts/post.vto
type: post
---


MacBook AirにUbuntu 15.04をインストールした。
だいたい使いやすくはなっているのだけど、たまにキーボード入力をしている時にタッチパッドが誤反応してしまう時があった。

そこで、手のひら検出？とかいうのを入れてみることにした。

以下のファイルを作成する。

```bash
$ vim ~/.config/autostart/synclient.desktop
```
<!-- more -->

内容は以下の通り

```bash
[Desktop Entry]
Type=Application
Exec=synclient PalmDetect=1
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name[ja]=synclient(PalmDetect)
Name=synclient(PalmDetect)
Comment[ja]=
Comment=
```

Superキーを押して出てくる検索メニューから「自動起動するアプリケーション」を選択して、そこで記載するのと同じ。

- - -

##### 参考
[安全にsynclientでUbuntuのタッチパッド設定を変更する - Qiita](http://qiita.com/kaz8/items/51a43a7290c29919bc2e)

