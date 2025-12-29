---
title: 自動的にファイルバックアップする (denops.vim)
date: 2022-05-28
draft: false
tags:
  - vim
  - neovim
  - deno
  - denops
layout: layouts/post.vto
type: post
zenn_type: tech
description: "指定したイベント（`CursorHold`など）で自動的にファイルのバックアップを作成するプラグイン「dps-autobackup」を作成しました。"
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/2022-05-28_dps-autobackup) にも投稿しています。

またまた [denops.vim](https://github.com/vim-denops/denops.vim) で `plugin` 作成しました！

`denops auto backup !`

[yukimemi/dps-autobackup](https://github.com/yukimemi/dps-autobackup)

<!-- more -->

## インストールと設定

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'vim-denops/denops.vim'

[[plugins]]
repo = 'yukimemi/dps-autobackup'
depends = 'denops.vim'
on_event = ['CursorHold', 'FocusLost', 'BufWritePre']
hook_add = '''
" デバッグオプション (v:true にするといっぱいログ出る。)
let g:autobackup_debug = v:false
" このプラグインを有効にするかどうか
let g:autobackup_enable = v:true
" 自動保存時に echo 表示するかどうか
let g:autobackup_write_echo = v:true
" バックアップディレクトリ
let g:autobackup_dir = '~/.cache/autobackup'
" 自動保存を行うイベント
let g:autobackup_events = ["CursorHold", "CursorHoldI", "BufWritePre", "BufRead"]
" 自動保存を行わないファイルタイプ
let g:autobackup_blacklist_filetypes = ["log", "csv"]
'''
```

デフォルトの設定はリポジトリの
[README](https://github.com/yukimemi/dps-autobackup/blob/main/README.md) に記載。

## 自動保存

設定したイベント (デフォルトは `CursorHold` と `BufWritePre` ) 発火時に自動保存が実行される。

`g:autobackup_dir/YYYY/MM/DD/ファイル名のパスセパレータを%で置き換えたもの_YYYYMMDD_HHmmssSSS.拡張子`

で保存される。 以下のような感じ。

```bash
~/.cache/autobackup
└── 2022
    └── 05
        └── 28
            ├── %Users%yukimemi%.dotfiles%.config%nvim%rc%dps-autobackup_20220528_140453336.vim
            ├── %Users%yukimemi%.dotfiles%.config%wezterm%wezterm_20220528_201606161.lua
            ├── %Users%yukimemi%.dotfiles%.config%zeno%config_20220528_143055933.yml
            ├── %Users%yukimemi%.dotfiles%.config%zeno%config_20220528_143055943.yml
            ├── %Users%yukimemi%.dotfiles%.mappings_20220528_200942498
            ├── %Users%yukimemi%.tmux_20220528_202806025.conf
            ├── %Users%yukimemi%.zshenv_20220528_201351619
            ├── %Users%yukimemi%.zshenv_20220528_202705714
```

## コマンド

コマンドで有効化 / 無効化ができる。

```vim
" 無効化
:DisableAutobackup

" 有効化
:EnableAutobackup
```

## インスパイア元

以下です。 ずっと使ってお世話になってました！ありがとうございました！

[aiya000/aho-bakaup.vim: aho-bakaup.vim backs up any files when you write the file](https://github.com/aiya000/aho-bakaup.vim)
