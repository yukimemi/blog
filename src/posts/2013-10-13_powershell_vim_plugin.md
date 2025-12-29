---
title: powershell vim plugin
date: 2013-10-13
draft: false
tags:
  - powershell
  - vim
  - vim-plugin
layout: layouts/post.vto
type: post
description: "VimでPowerShellスクリプト（ps1ファイル）を書くためのプラグイン「vim-ps1」の導入方法を紹介します。"
---


powershell script を vim で書くためのプラグイン

<!-- more -->
```vim
NeoBundleLazy 'PProvost/vim-ps1', {
      \   'autoload' : {'filetypes': ['ps1']}
      \ }
```
