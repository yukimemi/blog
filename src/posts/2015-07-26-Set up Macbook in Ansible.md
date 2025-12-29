---
title: Set up Macbook in Ansible
date: 2015-07-26T16:08:23+09:00
draft: false
tags:
  - mac
  - ansible
layout: layouts/post.vto
type: post
description: "新しいMacBookのセットアップをAnsibleで行いました。Homebrewパッケージの管理などを含めたPlaybookを作成し、自動化した話です。"
---


せっかくMacbookを新調したので、セットアップを今までのオレオレスクリプトから、ansibleに移行した。

先人の参考になりまくる記事がいっぱいあるので、けっこう簡単に出来た。

[yukimemi/ansible-playbook](https://github.com/yukimemi/ansible-playbook)

<!-- more -->

参考記事だと、ansible-galaxyで、事前にhomebrewパッケージをインストールしなきゃいけない
みたいに書いてあるけど、実際は不要だった。

べんりだansible。
Mac以外にも対応出来るように今後は拡張していきたい。

- - -
##### 参考

[AnsibleでHomebrew, Cask, Atomエディターのパッケージを管理する - Qiita](http://goo.gl/oAjTzf)

[MacだってAnsibleで構成管理したい！ - Qiita](http://goo.gl/SrOGry)

[Mac の開発環境構築を自動化する (2015 年初旬編) - t-wadaのブログ](http://goo.gl/xczLlf)

