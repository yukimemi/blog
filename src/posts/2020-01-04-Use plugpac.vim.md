---
title: Use plugpac.vim
date: 2020-01-04T17:40:00+09:00
draft: false
tags:
  - vim
  - neovim
  - minpac
  - plugpac
layout: layouts/post.vto
type: post
---


`2020-01-12` プラグインの保存先に、 `~/.vim` でなく、 `~/.cache` を使用する設定を書きました。

→ [yukimemi's blog - Use .cache directory for vim plugins](https://yukimemi.netlify.com/use-cache-directory-for-vim-plugins/)

こっちのがいいかも。

---

[k-takata/minpac](https://github.com/k-takata/minpac) のラッパーとして、[bennyyip/plugpac.vim](https://github.com/bennyyip/plugpac.vim) ってのができてた。

<!-- more -->

[k-takata/minpac](https://github.com/k-takata/minpac) を使用するんだけど、あるコマンドが実行されたとき、特定の filetype のとき、等で読み込み (packadd) ができるようになるラッパープラグイン。
[junegunn/vim-plug](https://github.com/junegunn/vim-plug) に似た感じで利用できるようになる。

[vim-plug](https://github.com/junegunn/vim-plug) を利用している人にとってはめちゃくちゃ乗り換えやすいと思う。
かつ、 [minpac](https://github.com/k-takata/minpac) は vim 標準の package 機能を使っているのでよりシンプルに動作する。 (と思う)

使い方は簡単で、 [plugpac.vim](https://github.com/bennyyip/plugpac.vim) にある README の通りに実施するだけ。

ただ、前回の [記事](https://yukimemi.netlify.com/use-minpac-vim/) で書いたように、遅延ロードを実行したい。
あと、 [Shougo/dein.vim](https://github.com/Shougo/dein.vim) にあるような、 `if` も指定したい。

・・・ということで、 `type` に `lazy` を追加、 `if` が指定できるようにした。
(できれば本家にプルリク送りたいけど、急ぎで作ったのでまだできておらず・・・)

[yukimemi/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/yukimemi/plugpac.vim)


`.vimrc` や `init.vim` の設定はこんな感じ。

```vim
" Init: {{{1
set encoding=utf-8
scriptencoding utf-8

if &compatible | set nocompatible | endif
augroup MyAutoCmd | autocmd! | augroup END

" Echo startup time on start.
if has('vim_starting') && has('reltime')
  let s:startuptime = reltime()
  au MyAutoCmd VimEnter * let s:startuptime = reltime(s:startuptime) | redraw
        \ | echomsg 'startuptime: ' . reltimestr(s:startuptime)
endif

" Utility: {{{1
" Judge os type. {{{2
let g:is_windows = has('win16') || has('win32') || has('win64')
let g:is_cygwin = has('win32unix')
let g:is_darwin = has('mac') || has('macunix') || has('gui_macvim')
let g:is_linux = !g:is_windows && !g:is_cygwin && !g:is_darwin

" Plugins: {{{1
let s:minpac_dir = '~/.vim/pack/minpac/opt/minpac'
let s:plugpac_dir = '~/.vim/autoload'
let s:minpac_download = 0
if has('vim_starting')
  if !isdirectory(expand(s:minpac_dir))
    echo "Install minpac ..."
    execute 'silent !git clone --depth 1 https://github.com/k-takata/minpac ' . s:minpac_dir
    execute 'silent !git clone --depth 1 --no-checkout --filter=blob:none https://github.com/yukimemi/plugpac.vim ' . s:plugpac_dir
    execute 'silent !git -C ' . s:plugpac_dir . ' checkout master -- plugpac.vim'
    let s:minpac_download = 1
  endif
endif

let g:plugpac_cfg_path = '~/.vim/rc'

call plugpac#begin()

" minpac
Pack 'k-takata/minpac', {'type': 'opt'}

" start {{{2
Pack 'Yggdroot/indentLine'
Pack 'itchyny/vim-parenmatch'
Pack 'kana/vim-operator-user'
Pack 'kana/vim-textobj-user'
Pack 'mattn/transparency-windows-vim', {'if': g:is_windows}
Pack 'mattn/vimtweak', {'if': g:is_windows}
Pack 'roxma/nvim-yarp', {'if': !has('nvim')}
Pack 'roxma/vim-hug-neovim-rpc', {'if': !has('nvim')}
Pack 'ryanoasis/vim-devicons'
Pack 'sheerun/vim-polyglot'
Pack 't9md/vim-quickhl'
Pack 'vim-airline/vim-airline'
Pack 'vim-airline/vim-airline-themes'

" opt {{{2
Pack 'morhetz/gruvbox', {'type': 'opt'}
" On-demand loading
Pack 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Pack 'tpope/vim-fireplace', { 'for': 'clojure' }
" Post-update hook
Pack 'Yggdroot/LeaderF', { 'do': {-> system('./install.sh')}, 'if': g:is_windows }
Pack 'liuchengxu/vim-clap', {'type': 'opt', 'on': 'Clap'}
" Sepcify commit ID, branch name or tag name to be checked out.
Pack 'tpope/vim-sensible', { 'rev': 'v1.2' }
Pack 'junegunn/vim-easy-align', {'type': 'opt', 'on': '<Plug>(EasyAlign)'}
Pack 'lambdalisue/gina.vim', {'type': 'opt', 'on': 'Gina'}
Pack 'majutsushi/tagbar', {'type': 'opt', 'on': 'TagbarToggle'}
Pack 'mattn/sonictemplate-vim', {'type': 'opt', 'on': 'Template'}
Pack 'mbbill/undotree', {'type': 'opt', 'on': 'UndotreeToggle'}
Pack 'mechatroner/rainbow_csv', {'type': 'opt', 'for': 'csv'}
Pack 'mhinz/vim-grepper', {'type': 'opt', 'on': ['Grepper', '<Plug>(GrepperOperator)']}

" lazy {{{2
Pack 'Shougo/context_filetype.vim', {'type': 'lazy'}
Pack 'Shougo/echodoc.vim', {'type': 'lazy'}
Pack 'airblade/vim-rooter', {'type': 'lazy'}
Pack 'andymass/vim-matchup', {'type': 'lazy'}
Pack 'haya14busa/is.vim', {'type': 'lazy'}
Pack 'haya14busa/vim-asterisk', {'type': 'lazy'}
Pack 'haya14busa/vim-edgemotion', {'type': 'lazy'}
Pack 'haya14busa/vim-operator-flashy', {'type': 'lazy'}
Pack 'itchyny/vim-cursorword', {'type': 'lazy'}
Pack 'itchyny/vim-external', {'type': 'lazy'}
Pack 'itchyny/vim-highlighturl', {'type': 'lazy'}
Pack 'kana/vim-operator-replace', {'type': 'lazy'}
Pack 'kana/vim-textobj-entire', {'type': 'lazy'}
Pack 'kana/vim-textobj-fold', {'type': 'lazy'}
Pack 'kana/vim-textobj-function', {'type': 'lazy'}
Pack 'kana/vim-textobj-indent', {'type': 'lazy'}
Pack 'kana/vim-textobj-line', {'type': 'lazy'}
Pack 'kshenoy/vim-signature', {'type': 'lazy'}
Pack 'vim-scripts/autodate.vim', {'type': 'lazy'}

call plugpac#end()

" Install on initiall setup.
if s:minpac_download
  PackInstall
endif

" Color: {{{1
syntax enable
set background=dark
colorscheme gruvbox

" vim:fdm=marker expandtab fdc=3 ft=vim ts=2 sw=2 sts=2:
```

`type` に `lazy` を指定したプラグインは、 `VimEnter` 後にバックグラウンドで `packadd` される。
全部のプラグインが `packadd` されたら `lazy load done !` と表示される。
後から読み込んでも問題ないプラグインはじゃんじゃん `type` を `lazy` に指定することで、 Vim の起動自体はかなり早くすることができるはず！

ちなみに、各プラグインの設定ファイルは、以下のようにディレクトリを指定していれば配下にあるプラグイン名のファイルを自動的に読み込むようになっている。 (リポジトリ URL の最後の部分、もしくは URL の最後の部分 + `.vim`)

`Pack` コマンドで指定したものだけが読み込まれるため、不要な設定が存在していても問題ない。
一時的に無効化したかったら、 `Pack` コマンドの行だけコメントアウトすれば対象の設定ファイルも読み込まれなくなる。

```vim
let g:plugpac_cfg_path = '~/.vim/rc'
```

```sh
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
├── vim-external.vim
├── vim-findent.vim
├── vim-grepper.vim
├── vim-operator-replace.vim
├── vim-parenmatch.vim
├── vim-polyglot.vim
├── vim-quickhl.vim
├── vim-rooter.vim
├── vim-shiny.vim
├── vim-submode.vim
├── vim-textobj-entire.vim
├── vim-textobj-fold.vim
├── vim-textobj-function.vim
├── vim-textobj-indent.vim
└── yankround.vim
```

## 参考
- - -
- [yukimemi/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/yukimemi/plugpac.vim)
- [bennyyip/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/bennyyip/plugpac.vim)
- [k-takata/minpac: A minimal package manager for Vim 8 (and Neovim)](https://github.com/k-takata/minpac)

