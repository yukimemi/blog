---
title: Add lazyall option for plugpac.vim
date: 2020-01-25T17:27:00+09:00
draft: false
tags:
  - vim
  - neovim
  - minpac
  - plugpac
layout: layouts/post.vto
type: post
---


最近自分の中であつい、 [plugpac.vim](https://github.com/yukimemi/plugpac.vim) 。

指定できる `type` に `lazy` を追加したのだけれども、プラグインの設定ファイル自体も遅延で読み込んだらさらに `vim` の起動速くなるんじゃ・・・？？
と思って、やってみた。

[yukimemi/plugpac.vim](https://github.com/yukimemi/plugpac.vim)

<!-- more -->

設定の方法は、 `type` に `lazyall` を指定するだけ。
`lazy` の場合は `g:plugpac_cfg_path` に設定されたディレクトリにプラグイン名のファイルがあった場合は `vim` 起動中に読み込む (source) けど、 `lazyall` が指定された場合は、遅延で `vim` 起動後に読み込まれる。

手元で試した感じ、ほんの少し (0.01 s くらい？) 速くなったきがする。
なので、設定としてはこんな感じ。

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
let s:cache_dir = '~/.cache/vim'
let s:minpac_dir = s:cache_dir . '/pack/minpac/opt/minpac'
let s:plugpac_dir = s:cache_dir . '/plugpac'
let s:minpac_download = 0
if has('vim_starting')
  if !isdirectory(expand(s:minpac_dir))
    echo "Install minpac ..."
    execute 'silent !git clone --depth 1 https://github.com/k-takata/minpac ' . s:minpac_dir
    let s:minpac_download = 1
  endif
  if !filereadable(expand(s:plugpac_dir . '/autoload/plugpac.vim'))
    echo "Install plugpac ..."
    execute 'silent !git clone --depth 1 https://github.com/yukimemi/plugpac.vim ' . s:plugpac_dir . '/autoload'
  endif
  execute 'set packpath^=' . fnamemodify(s:cache_dir, ':p')
  execute 'set runtimepath^=' . fnamemodify(s:plugpac_dir, ':p')
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
Pack 'Shougo/context_filetype.vim', {'type': 'lazyall'}
Pack 'Shougo/echodoc.vim', {'type': 'lazyall'}
Pack 'airblade/vim-rooter', {'type': 'lazyall'}
Pack 'andymass/vim-matchup', {'type': 'lazyall'}
Pack 'haya14busa/is.vim', {'type': 'lazyall'}
Pack 'haya14busa/vim-asterisk', {'type': 'lazyall'}
Pack 'haya14busa/vim-edgemotion', {'type': 'lazyall'}
Pack 'haya14busa/vim-operator-flashy', {'type': 'lazyall'}
Pack 'itchyny/vim-cursorword', {'type': 'lazyall'}
Pack 'itchyny/vim-external', {'type': 'lazyall'}
Pack 'itchyny/vim-highlighturl', {'type': 'lazyall'}
Pack 'kana/vim-operator-replace', {'type': 'lazyall'}
Pack 'kana/vim-textobj-entire', {'type': 'lazyall'}
Pack 'kana/vim-textobj-fold', {'type': 'lazyall'}
Pack 'kana/vim-textobj-function', {'type': 'lazyall'}
Pack 'kana/vim-textobj-indent', {'type': 'lazyall'}
Pack 'kana/vim-textobj-line', {'type': 'lazyall'}
Pack 'kshenoy/vim-signature', {'type': 'lazyall'}
Pack 'vim-scripts/autodate.vim', {'type': 'lazyall'}

call plugpac#end()

" Install on initiall setup.
if s:minpac_download
  PackInstall
endif

" Color: {{{1
syntax enable
set background=dark
silent! colorscheme japanesque

" vim:fdm=marker expandtab fdc=3 ft=vim ts=2 sw=2 sts=2:
```

`type` に指定する `lazy` が `lazyall` になっただけ。

## 参考
- - -
- [yukimemi/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/yukimemi/plugpac.vim)
- [bennyyip/plugpac.vim: Thin wrapper of minpac, provides vim-plug-like experience](https://github.com/bennyyip/plugpac.vim)
- [k-takata/minpac: A minimal package manager for Vim 8 (and Neovim)](https://github.com/k-takata/minpac)

