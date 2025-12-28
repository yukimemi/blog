---
title: Walk files with dps-walk
date: 2021-04-11T15:26:10+09:00
draft: false
tags:
  - vim
  - neovim
  - denops
layout: layouts/post.vto
type: post
---


またまた [denops.vim](https://github.com/vim-denops/denops.vim) ネタ。

[yukimemi/dps-walk](https://github.com/yukimemi/dps-walk)

ファイルを `walk` して表示、 `filter` するやつ。

**Denops Walk** -> **dps-walk**

<script id="asciicast-OSvjzBbNthEzCk2tl4xfWv6h9" src="https://asciinema.org/a/OSvjzBbNthEzCk2tl4xfWv6h9.js" async></script>

<!-- more -->

## インストール

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'vim-denops/denops.vim'

[[plugins]]
repo = 'yukimemi/dps-walk'
hook_add = '''
let g:walk_debug = v:false
" let g:walk_bufsize = 500
" let g:walk_skips = ["\\.git", "\\.svn", "\\.hg", "\\.o$", "\\.obj$", "\\.a$", "\\.exe~?$", "tags$"]

nnoremap <space>wa <cmd>DenopsWalk<cr>
nnoremap <space>ws <cmd>DenopsWalk --path=~/src<cr>
nnoremap <space>wD <cmd>DenopsWalk --path=~/.dotfiles<cr>
nnoremap <space>wc <cmd>DenopsWalk --path=~/.cache<cr>
nnoremap <space>wm <cmd>DenopsWalk --path=~/.memolist<cr>
nnoremap <space>wd <cmd>DenopsWalkBufferDir<cr>
'''
```

依存として、 [denops.vim](https://github.com/vim-denops/denops.vim) が必要。(もちろん [Deno](https://deno.land/) も。)

設定は特に不要だが、上記コメントアウトしているように追加設定は可能。

- `g:walk_debug`

デバッグログ出力有無。デフォルト: `v:false`
調査で必要な時 `v:true` にすると、ログが `echomsg` される。

- `g:walk_bufsize`

`walk` して見つかったファイルを描画する単位。デフォルト 500 ファイルずつ溜め込んで表示する。
フィルターに文字打ち込むと、その時点の見つかったファイルで即時表示される。

- `g:walk_skips`

スキップする正規表現のリスト。
デフォルトは上記記載の通り。変更したい場合は設定する。

[deno.land/std@0.92.0/fs/walk.ts - deno doc](https://doc.deno.land/https/deno.land/std@0.92.0/fs/walk.ts#walk) の引数 `skip` に指定される。

- `DenopsWalk`

カレントディレクトリ配下のファイルを一覧表示する。
`--path` で `walk` 始めるルートパスを指定できる。指定しない場合はカレントディレクトリとなる。
また、引数に文字列を指定することで予め検索対象を絞ることができる。
指定しなかった場合は `Search for pattern:` というプロンプトが出るのでそこで入力する。
全部対象にしたい場合は何も入力せずにそのまま Enter。

`~/src` 配下で `vim` がファイル名につくものを検索する例。

```vim
:DenopsWalk --path=~/src vim
```

- `DenopsWalkBufferDir`

バッファのディレクトリ配下のファイルを一覧表示する。

## 不具合について

なぜか `Vim` では、 `startinsert!` が効かず、フィルターに入っても初期状態はノーマルモードのままとなってしまう・・・。
手動で `i` or `a` してインサートモードに入る必要あり・・・。

---

#### 参考

- [Shougo/denite.nvim: Dark powered asynchronous unite all interfaces for Neovim/Vim8](https://github.com/Shougo/denite.nvim)
- [vim-jp » vim-jp.slack.com log - #tech-denops - 2021 年 04 月](https://vim-jp.org/slacklog/C01N4L5362D/2021/04/#ts-1617463442.077700)
