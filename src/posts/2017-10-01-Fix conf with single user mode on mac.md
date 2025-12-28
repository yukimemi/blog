---
title: Fix conf with single user mode on mac
date: 2017-10-01T18:21:37+09:00
draft: false
tags:
  - vim
  - mac
  - single
  - apfs
layout: layouts/post.vto
type: post
---


`mac` でシングルユーザーモードの起動と、設定ファイルの修正方法。

nas の自動マウントを行おうとして、 `automount` の設定を変更していたら、再起動後、 `mac` が起動しなくなった。

その修正方法。

[Mac をシングルユーザモードまたは Verbose モードで起動する](https://support.apple.com/ja-jp/HT201573)

ここを見ればわかるが、mac起動時に、 `Command + S` を押しっぱなしでシングルユーザーモードに入れる。

んで、あとは、 `vi` で設定をもとに戻して終了・・・っと思いきや、設定を書き込み出来なかった。

デフォルトだと、 `/` が読み込み専用でマウントされている。
書き込み可能で再マウントする。 (High Sierra だったので、APFS)

<!-- more -->

```bash
# mount_apfs -uw /
```

これで書き込みできる。
設定は、 man で確認できる。

```bash
# man 8 mount
```

修正後、再起動して完了。

```bash
# reboot
```

- - -

##### 参考

[Mac をシングルユーザモードまたは Verbose モードで起動する](https://support.apple.com/ja-jp/HT201573)

