---
title: Use SpaceVim
date: 2019-04-06T21:19:31+09:00
draft: false
tags:
  - vim
  - SpaceVim
layout: layouts/post.vto
type: post
---


[SpaceVim](https://spacevim.org/) を使ってみた。

vim は結構カスタマイズしていたんだけど、結局カスタマイズが多くなりすぎて実際にコードを書くより優先されてしまって本末転倒になってしまっていたので、
自分で書く設定を極力シンプルにするという意味ではすごくいいのではないかと思った。
しばらく使ってみるつもり。

<!-- more -->

まだドキュメントが整備されていないのか、昔の `init.vim` を使用する方法で書かれたりする。
今は `init.vim` ではなく、 `init.toml` を使うみたい。
`vim` で設定する場合は、 `init.toml` 内で以下のように、 `bootstrap_before` と `bootstrap_after` の関数を指定する。

```toml
[options]
bootstrap_before = "init#before"
bootstrap_after = "init#after"
```

そして、それぞれの関数は以下の場所に配置する。

```sh
~/.SpaceVim.d
├── init.toml
└── autoload
   ├── after.vim
   ├── before.vim
   └── init.vim
```

`init.vim` 内で、 `before.vim` と `after.vim` を呼び出すように設定し、それぞれの設定ファイルで設定を行なっている。
今のところ以下のような感じ。

## init.toml
```toml
# =============================================================================
# File        : init.toml
# Author      : yukimemi
# Last Change : 2019/04/07 23:32:34.
# =============================================================================

# All SpaceVim option below [option] section
[options]
autocomplete_method = "coc"
automatic_update = false
# autocomplete_method = "coc"
bootstrap_after = "init#after"
bootstrap_before = "init#before"
checkinstall = true
# colorscheme = "SpaceVim"
colorscheme = "spring-night"
colorscheme_bg = "dark"
disabled_plugins = ["neopairs.vim"]
enable_ale = true
enable_cursorcolumn = false
enable_cursorline = false
enable_guicolors = true
enable_language_specific_leader = false
enable_neomake = false
enable_os_fileformat_icon = true
enable_statusline_mode = true
enable_tabline_filetype_icon = true
enable_vimfiler_welcome = false
filemanager = "vimfiler"
filetree_direction = "left"
github_username = "yukimemi"
relativenumber = false
simple_mode = true
statusline_separator = "arrow"
windows_index_type = 1

# layers. {{{1
[[layers]]
name = "autocomplete"
auto-completion-return-key-behavior = "complete"
auto-completion-tab-key-behavior = "smart"

[[layers]]
name = "shell"
default_position = "bottom"
default_height = 30

[[layers]]
name = "tools"
[[layers]]
name = "denite"
[[layers]]
name = "unite"
[[layers]]
name = "ctrlp"
[[layers]]
name = "VersionControl"
[[layers]]
name = "git"
[[layers]]
name = "github"
[[layers]]
name = "lsp"
[[layers]]
name = "sudo"
[[layers]]
name = "tmux"
[[layers]]
name = "operator"
[[layers]]
name = "tags"

[[layers]]
name = "format"
enable = false

# custom_plugins. {{{1
[[custom_plugins]]
name = "itchyny/vim-cursorword" # {{{2
[[custom_plugins]]
name = "itchyny/vim-parenmatch" # {{{2
hook_add = '''
source $SPACE_VIM/rc/vim-parenmatch.vim
'''
[[custom_plugins]]
name = "rhysd/vim-color-spring-night" # {{{2
[[custom_plugins]]
name = "kaneshin/ctrlp-filetype" # {{{2
on_cmd = ["CtrlPFiletype"]
[[custom_plugins]]
name = "kaneshin/ctrlp-memolist" # {{{2
on_cmd = ["CtrlPMemolist"]
[[custom_plugins]]
name = "mattn/ctrlp-launcher" # {{{2
on_cmd = ["CtrlPLauncher"]
[[custom_plugins]]
name = "ompugao/ctrlp-history" # {{{2
on_cmd = ["CtrlPCmdHistory"]
[[custom_plugins]]
name = "tyru/capture.vim" # {{{2
on_cmd = ["Capture"]
[[custom_plugins]]
name = "vim-scripts/autodate.vim" # {{{2
hook_add = '''
source $SPACE_VIM/rc/autodate.vim
'''
[[custom_plugins]]
name = "glidenote/memolist.vim" # {{{2
on_cmd = ["MemoList", "MemoNew", "MemoGrep"]
hook_add = '''
source $SPACE_VIM/rc/memolist.vim
'''
[[custom_plugins]]
name = "kana/vim-operator-replace" # {{{2
depends = "vim-operator-user"
on_map = "<Plug>(operator-replace"
hook_add = '''
source $SPACE_VIM/rc/vim-operator-replace.vim
'''
[[custom_plugins]]
name = "haya14busa/vim-asterisk" # {{{2
on_map = "<Plug>(asterisk-"
[[custom_plugins]]
name = "osyo-manga/vim-anzu" # {{{2
on_map = "<Plug>(anzu-"
[[custom_plugins]]
name = "haya14busa/is.vim" # {{{2
depends = ["haya14busa/vim-asterisk", "osyo-manga/vim-anzu"]
on_map = "<Plug>(is-"
hook_add = '''
source $SPACE_VIM/rc/is.vim
'''
[[custom_plugins]]
name = "sheerun/vim-polyglot" # {{{2
hook_add = '''
source $SPACE_VIM/rc/vim-polyglot.vim
'''
[[custom_plugins]]
name = "haya14busa/dein-command.vim" # {{{2
on_cmd = "Dein"
[[custom_plugins]]
name = "rhysd/committia.vim" # {{{2
[[custom_plugins]]
name = "iamcco/markdown-preview.nvim" # {{{2
depends = "open-browser.vim"
on_ft = "markdown"
on_cmd = "MarkdownPreview"
build = "cd app & yarn install"
# hook_post_update = '''
# call dein#source('markdown-preview.nvim')
# call mkdp#util#install()
# '''
[[custom_plugins]]
name = "dhruvasagar/vim-table-mode" # {{{2
on_ft = "markdown"
[[custom_plugins]]
name = "thinca/vim-qfreplace" # {{{2
on_ft = ["quickfix", "qf"]
[[custom_plugins]]
name = "qpkorr/vim-renamer" # {{{2
on_cmd = "Renamer"
hook_add = '''
source $SPACE_VIM/rc/vim-renamer.vim
'''
```

## init.vim
```vim
" =============================================================================
" File        : init.vim
" Author      : yukimemi
" Last Change : 2019/03/10 22:21:02.
" =============================================================================

let s:path = fnamemodify(resolve(expand('<sfile>:p')), ':h')

function! init#before() abort
  execute 'source '.s:path.'/before.vim'
endfunction

function! init#after() abort
  execute 'source '.s:path.'/after.vim'
endfunction

" vim: fdm=marker expandtab fdc=3 ft=vim ts=2 sw=2 sts=2:

```

## before.vim
```vim
" =============================================================================
" File        : before.vim
" Author      : yukimemi
" Last Change : 2019/03/31 09:06:23.
" =============================================================================

" Init: {{{1
" Release autogroup in MyAutoCmd.
augroup MyAutoCmd
  autocmd!
augroup END

" Echo startup time on start.
if has('vim_starting') && has('reltime')
  let s:startuptime = reltime()
  au MyAutoCmd VimEnter * let s:startuptime = reltime(s:startuptime) | redraw
        \ | echomsg 'startuptime: ' . reltimestr(s:startuptime)
endif

" Set mapleader.
let mapleader = ','
let maplocalleader = ','

" PATH.
let $SPACE_VIM = expand("~/.SpaceVim.d")

" Utility: {{{1
" Judge os type. {{{2
let g:is_windows = has("win16") || has("win32") || has("win64")
let g:is_cygwin = has("win32unix")
let g:is_darwin = has("mac") || has("macunix") || has("gui_macvim")
let g:is_linux = !g:is_windows && !g:is_cygwin && !g:is_darwin

" SpaceVim config. {{{2
if g:is_windows
  let g:spacevim_disabled_plugins = ["denite.nvim"]
endif

" Functions: {{{1
function! Mkdir(dir) "{{{2
  if !isdirectory(a:dir)
    call mkdir(a:dir, "p")
  endif
endfunction


" vim: fdm=marker expandtab fdc=3 ft=vim ts=2 sw=2 sts=2:
```

## after.vim
```vim
" =============================================================================
" File        : after.vim
" Author      : yukimemi
" Last Change : 2019/04/07 15:55:17.
" =============================================================================

" Functions: {{{1
function! s:open_current_dir() abort "{{{2
  if g:is_windows
    setl noshellslash
    silent! exe printf("!start \"%s\"", expand("%:h"))
    setl shellslash
  else
    silent! exe printf("!open \"%s\"", expand("%:h"))
  endif
endfunction


" Basic: {{{1
" Options. {{{2
set cmdheight=2

" Clipboard. {{{2
set clipboard=unnamed,unnamedplus

" encode. {{{2
set fileencodings=ucs-bom,utf-8,cp932,utf-16le,iso-8859-15

" grep. {{{2
if executable("jvgrep")
  set grepprg=jvgrep
endif

" Hilight cursorline, cursorcolumn {{{2
" http://d.hatena.ne.jp/thinca/20090530/1243615055
au MyAutoCmd CursorMoved,CursorMovedI * call s:auto_cursorline('CursorMoved')
au MyAutoCmd CursorHold,CursorHoldI * call s:auto_cursorline('CursorHold')
au MyAutoCmd WinEnter,BufEnter,CmdwinLeave * call s:auto_cursorline('WinEnter,BufEnter,CmdwinLeave')
au MyAutoCmd WinLeave * call s:auto_cursorline('WinLeave')

let s:cursorline_lock = 0
function! s:auto_cursorline(event)
  if a:event ==# 'WinEnter,BufEnter,CmdwinLeave'
    setlocal cursorline
    setlocal cursorcolumn
    let s:cursorline_lock = 2
  elseif a:event ==# 'WinLeave'
    setlocal nocursorline
    setlocal nocursorcolumn
  elseif a:event ==# 'CursorMoved'
    if s:cursorline_lock
      if 1 < s:cursorline_lock
        let s:cursorline_lock = 1
      else
        setlocal nocursorline
        setlocal nocursorcolumn
        let s:cursorline_lock = 0
      endif
    endif
  elseif a:event ==# 'CursorHold'
    if &updatetime >= 4000
      setlocal cursorline
      setlocal cursorcolumn
    endif
    let s:cursorline_lock = 1
  endif
endfunction

" Mappings: {{{1
nnoremap <silent> <Leader><Leader> :<C-u>update<CR>

" For window.
nnoremap <silent> sj <C-w>j
nnoremap <silent> sk <C-w>k
nnoremap <silent> sl <C-w>l
nnoremap <silent> sh <C-w>h
nnoremap <silent> sJ <C-w>J
nnoremap <silent> sK <C-w>K
nnoremap <silent> sL <C-w>L
nnoremap <silent> sH <C-w>H
nnoremap <silent> sr <C-w>r
nnoremap <silent> s= <C-w>=
nnoremap <silent> sw <C-w>w
nnoremap <silent> so <C-w>_<C-w>|
nnoremap <silent> s0 :<C-u>only<CR>
nnoremap <silent> sO :<C-u>tabonly<CR>
nnoremap <silent> sn :<C-u>bn<CR>
nnoremap <silent> sp :<C-u>bp<CR>
nnoremap <silent> st :<C-u>tabnew<CR>
nnoremap <silent> ss :<C-u>sp<CR>
nnoremap <silent> sv :<C-u>vs<CR>
nnoremap <silent> sq :<C-u>q<CR>
nnoremap <silent> sQ :<C-u>qa<CR>
nnoremap <silent> sbk :<C-u>bd!<CR>
nnoremap <silent> sbq :<C-u>q!<CR>

" For tab.
nnoremap <silent><C-l> gt
nnoremap <silent><C-h> gT

" nohlsearch.
nnoremap <silent> <ESC><ESC> :<C-u>nohlsearch<CR>

" Open folding in "l"
nnoremap <expr> l foldlevel(line('.')) ? "\<Right>zo" : "\<Right>"

noremap <silent> gh ^
noremap <silent> gl $

nnoremap <silent> <Leader>o :<C-u>call <SID>open_current_dir()<CR>
inoremap <silent> <ESC> <ESC>:set iminsert=0<CR>

" Autocmd: {{{1
" https://lambdalisue.hatenablog.com/entry/2017/12/24/165759
au MyAutoCmd BufWritePost *
      \ if &filetype ==# '' && exists('b:ftdetect') |
      \   unlet! b:ftdetect |
      \   filetype detect |
      \ endif

" For swap.
" http://itchyny.hatenablog.com/entry/2014/12/25/090000
au MyAutoCmd SwapExists * let v:swapchoice = 'o'

" Escape cmd win.
au MyAutoCmd CmdwinEnter * nnoremap <silent><buffer><nowait> <ESC> :q<CR>

" Escape E211.
au MyAutoCmd FileChangedShell * execute

au MyAutoCmd QuickfixCmdPost make,grep,grepadd,vimgrep copen


" Plugins: {{{1
source $SPACE_VIM/rc/ale.vim
source $SPACE_VIM/rc/coc.vim
source $SPACE_VIM/rc/clever-f.vim
source $SPACE_VIM/rc/ctrlp.vim
source $SPACE_VIM/rc/vim-ps1.vim

" FileType: {{{1
" xml {{{2
let g:xml_syntax_folding = 1
au MyAutoCmd BufNewFile,BufRead *.xml call <SID>filetype_xml()
function! s:filetype_xml() abort
  setl noexpandtab
  setl ts=4 sw=4 sts=0
  setl foldmethod=syntax
endfunction

" vim: fdm=marker expandtab fdc=3 ft=vim ts=2 sw=2 sts=2:
```


## 参考
- - -
[Documentation | SpaceVim](https://spacevim.org/documentation/)

