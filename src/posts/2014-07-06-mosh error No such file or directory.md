---
title: mosh error No such file or directory
date: 2014-07-06
draft: false
tags:
  - mosh
  - zsh
  - ssh
layout: layouts/post.vto
type: post
description: "MacからMoshで接続しようとした際に発生した「No such file or directory」エラーの原因と、対処法についてメモしました。"
---


mosh というmobile-shelllを導入してみたところ、「No such file or directory」という
エラーが発生して使えなかった・・・。

原因は結局よくわからなかったんだけど、とりあえず使えるようになったので、一応メモとして残しとこ。


### mosh install
環境は Mac OSX Mavericks。Homebrewで簡単にインストール出来た。

```bash
$ brew install mosh
```
<!-- more -->

昔は ```mobile-shelll``` だったみたいだけど、今は ```mosh``` でインストール出来る。
クライアント側とサーバ側両方インストールしておく必要あり。

### 使い方
普通の ```ssh``` を ```mosh``` に変えるだけ。

```bash
$ ssh yukimemi@yukimemi-my-host.com
```

↓

```bash
$ mosh yukimemi@yukimemi-my-host.com
```

だけど、なぜか、こんなエラーが出て使えなかった・・・。

```bash
$ mosh yukimemi@yukimemi-my-host.com
zsh: No such file or directory
ssh_exchange_identification: Connection closed by remote host
/usr/local/bin/mosh: Did not find remote IP address (is SSH ProxyCommand disabled?).
```

なんかzshが見つかんない？みたいなエラー。
zshが悪いのかと思い、bashからやってみてもエラーになった。

```bash
$ mosh yukimemi@yukimemi-my-host.com
bash: No such file or directory
ssh_exchange_identification: Connection closed by remote host
/usr/local/bin/mosh: Did not find remote IP address (is SSH ProxyCommand disabled?).
```

環境変数が悪いのか？と思い、以下のようにしてみた。

```bash
$ SHELL=/bin/bash mosh yukimemi@yukimemi-my-host.com
bash: mosh-server: command not found
Connection to yukimemi-my-host.com closed.
/usr/local/bin/mosh: Did not find mosh server startup message.
```

一応なんかエラーメッセージは変わったみたい。
これは ```mosh-server``` コマンドが見つかんないって言ってるだけなので、
moshのオプションで指定出来るっぽい。

```bash
$ SHELL=/bin/bash mosh --server=/usr/local/bin/mosh-server yukimemi@yukimemi-my-host.com
[yukimemi@yukimemi-my-host.com] $
```

つながった。
Airを閉じて一度ネットの接続がきれても、自動で再接続してくれるの便利。

- - -

##### 参考

[Moshを使ってみる #Linux - rcmdnk's blog](http://rcmdnk.github.io/blog/2014/06/30/computer-linux-mac/)

