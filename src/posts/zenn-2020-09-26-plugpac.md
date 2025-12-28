---
title: Vim プラグインマネージャー plugpac.vim (minpac ラッパー)
date: 2020-09-26
draft: false
tags:
  - vim
  - neovim
  - plugin
layout: layouts/post.vto
type: post
zenn_type: tech
---


## Vim (Neovim) プラグインマネージャー plugpac.vim の紹介

[k-takata/minpac](https://github.com/k-takata/minpac) のラッパーとして、[bennyyip/plugpac.vim](https://github.com/bennyyip/plugpac.vim) ってのがあります。

[k-takata/minpac](https://github.com/k-takata/minpac) を使用するのですが、あるコマンドが実行されたとき、特定の filetype のとき、等で読み込み (packadd) ができるようになるラッパープラグインで、 [junegunn/vim-plug](https://github.com/junegunn/vim-plug) に似た感じで利用できるようになります。

[vim-plug](https://github.com/junegunn/vim-plug) を利用している人にとってはめちゃくちゃ乗り換えやすいと思います。
かつ、 [minpac](https://github.com/k-takata/minpac) は vim 標準の package 機能を使っているのでよりシンプルに動作する・・・と思います。

使い方は簡単で、 [plugpac.vim](https://github.com/bennyyip/plugpac.vim) にある README の通りに実施するだけです。
[vim-plug](https://github.com/junegunn/vim-plug) に似た感じで [minpac](https://github.com/k-takata/minpac) を使用できるはずです！

ただ、 [Shougo/dein.vim](https://github.com/Shougo/dein.vim) にあるような、 `if` だったり、 `on_event` だったりも使用したい・・・！
ということで、追加してみました。

[yukimemi/plugpac.vim](https://github.com/yukimemi/plugpac.vim)

(プルリク送ってますが、取り込まれてません・・・)

`.vimrc` や `init.vim` の設定はこんな感じに書けばいけるはず。

```vim
set encoding=utf-8
scriptencoding utf-8

" Set path.
let $CACHE = expand('~/.cache')
if has('nvim')
  let $VIM_PATH = expand('~/.config/nvim')
  let $CACHE_HOME = expand('$CACHE/nvim')
else
  let $VIM_PATH = expand('~/.vim')
  let $CACHE_HOME = expand('$CACHE/vim')
endif

" Use plugpac (minpac).
set packpath^=$CACHE_HOME
let s:package_home = $CACHE_HOME . '/pack/minpac'
let s:minpac_dir = s:package_home . '/opt/minpac'
let s:plugpac_dir = $CACHE_HOME . '/plugpac'
let s:minpac_download = 0
if has('vim_starting')
  if !isdirectory(expand(s:minpac_dir))
    echo "Install minpac ..."
    execute 'silent! !git clone -b devel --depth 1 https://github.com/k-takata/minpac ' . s:minpac_dir
    let s:minpac_download = 1
  endif
  if !filereadable(expand(s:plugpac_dir . '/autoload/plugpac.vim'))
    echo "Install plugpac ..."
    execute 'silent! !git clone --depth 1 https://github.com/yukimemi/plugpac.vim ' . s:plugpac_dir . '/autoload'
  endif
  execute 'set runtimepath^=' . fnamemodify(s:plugpac_dir, ':p')
  let g:plugpac_cfg_path = $VIM_PATH . '/rc'
endif

" Plugin list.
call plugpac#begin()

" 明示的な opt 指定
" 何も指定しない場合は start になる。
" 遅延オプション `on`, `event` など指定時は自動的に `opt` になる。
Pack 'k-takata/minpac', {'type': 'opt'}
Pack 'NLKNguyen/papercolor-theme', {'type': 'opt'}

" `if` オプション
Pack 'LumaKernel/nvim-visual-eof.lua', {'type': 'lazyall', 'if': has('nvim')}
Pack 'lambdalisue/seethrough.vim', {'if': !has('gui')}
" `event` オプション
Pack 'andymass/vim-matchup', {'event': 'CursorHold'}
Pack 'itchyny/vim-cursorword', {'event': ['CursorHold', 'CursorMoved']}
" timer_start による遅延ロード
Pack 'thinca/vim-submode', {'type': 'lazy'}
" `lazyall` の場合は後述する設定ファイルの source も遅延実施
Pack 'jeffkreeftmeijer/vim-numbertoggle', {'type': 'lazyall'}
Pack 'LeafCage/yankround.vim', {'type': 'lazyall'}

Pack 'machakann/vim-highlightedyank', {'type': 'lazyall', 'if': !has('nvim')}
Pack 'ntpeters/vim-better-whitespace', {'event': 'CursorHold'}

" mapping や filetype, command によるロード
Pack 'haya14busa/vim-edgemotion', {'on': ['<Plug>(edgemotion-j)', '<Plug>(edgemotion-k)']}
Pack 'lambdalisue/vim-findent', {'on': 'Findent'}
Pack 'glidenote/memolist.vim', {'on': ['MemoNew', 'MemoList', 'MemoGrep']}
Pack 'dhruvasagar/vim-table-mode', {'for': 'markdown'}

" インストール後のコマンド実行
Pack 'iamcco/markdown-preview.nvim', {'on': 'MarkdownPreview', 'do': '!cd app & yarn install'}

call plugpac#end()

if s:minpac_download
  PackInstall
endif

filetype plugin indent on
```

通常の `vim` のパッケージ機能では、 `type` に指定できるのは `start` か `opt` だけなのですが、設定としては `lazy` 、 `lazyall` というのを設けています。
どちらも内部的には `opt` として扱われて、 `timer_start` によりバックグラウンドで `packadd` されます。

`timer_start` による遅延ロードでは全部のプラグインが `packadd` されたら `lazy load done !` と表示されるようになってます。
後から読み込んでも問題ないプラグインはじゃんじゃん `type` を `lazy` や `lazyall` に指定することで、 `vim` の起動自体はかなり早くすることができるはず！です。

各プラグインの設定ファイルは、 `g:plugpac_cfg_path` でディレクトリを指定していれば配下にあるプラグイン名のファイルを自動的に読み込むようになっています。
(ファイル名はリポジトリ URL の最後の部分、もしくは URL の最後の部分 + `.vim`)

`Pack` コマンドで指定したものだけが読み込まれるため、不要な設定ファイルが存在していても問題はありません。
一時的に無効化したかったら、 `Pack` コマンドの行だけコメントアウトすれば対象の設定ファイルも読み込まれなくなります。

```vim
let g:plugpac_cfg_path = '~/.vim/rc'
```

のような設定をした場合は、下記のようにプラグイン名でファイルを作成しておけば `Pack` コマンドで指定したプラグイン名の設定ファイルが自動的に `source` されます。
この `source` されるタイミングが、 `lazy` の場合は即時 ( `Pack` コマンド実行時)、 `lazyall` の場合は `timer_start` により遅延で実施されます。

```bash
~/.vim/rc
├── autodate.vim
├── coc.nvim
├── csv.vim
├── gina.vim
├── gruvbox.vim
├── indentLine.vim
├── sonictemplate-vim.vim
├── tagbar.vim
├── textobj-lastpaste.vim
├── undotree.vim
├── vim-airline.vim
├── vim-clap.vim
├── vim-cursorword.vim
├── vim-devicons.vim
├── vim-dirvish.vim
├── vim-easy-align.vim
├── vim-textobj-indent.vim
└── yankround.vim
```

僕が実際にしている設定は以下にあります。

- [dotfiles/minpac.vim at master · yukimemi/dotfiles](https://github.com/yukimemi/dotfiles/blob/master/.config/nvim/minpac.vim)
- [dotfiles/minpac_plugins.vim at master · yukimemi/dotfiles](https://github.com/yukimemi/dotfiles/blob/master/.config/nvim/minpac_plugins.vim)

・・・とここまで紹介してますが、今はまた [dein](https://github.com/Shougo/dein.vim) を使っています・・・・。
ちょこちょこ切り替えて使っているので、また [plugpac.vim](https://github.com/yukimemi/plugpac.vim) 使うかも・・・。

## 参考

---

- [dotfiles/minpac.vim at master · yukimemi/dotfiles](https://github.com/yukimemi/dotfiles/blob/master/.config/nvim/minpac.vim)
- [dotfiles/minpac_plugins.vim at master · yukimemi/dotfiles](https://github.com/yukimemi/dotfiles/blob/master/.config/nvim/minpac_plugins.vim)
- [yukimemi/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/yukimemi/plugpac.vim)
- [bennyyip/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/bennyyip/plugpac.vim)
- [k-takata/minpac: A minimal package manager for Vim 8 (and Neovim)](https://github.com/k-takata/minpac)
