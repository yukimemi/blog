---
title: Save session with vim-reanimate
date: 2021-05-02T08:24:02+09:00
draft: false
tags:
  - vim
  - neovim
  - vim-reanimate
layout: layouts/post.vto
type: post
---


[Setup deno environment for vim](https://yukimemi.netlify.app/setup-deno-environment-for-vim/)
で、 `Vim` でテスト環境を作成したが、一時的にテスト結果出力ウィンドウを最大化してまた同じウィンドウレイアウトに戻りたい！
みたいなことができ、セッション保存のプラグインとして、 [osyo-manga/vim-reanimate](https://github.com/osyo-manga/vim-reanimate) を使用してみた。

<!-- more -->

このプラグインの使い方作者の方の以下記事でめちゃよく解説されてるのでそこを見れば使えると思う。

[reanimate.vim というプラグインをつくった - C++でゲームプログラミング](https://osyo-manga.hatenadiary.org/entry/20120214/1329223884)

## インストールと設定

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'osyo-manga/vim-reanimate'
on_cmd = ['ReanimateSave', 'ReanimateLoad']
hook_add = '''
let g:reanimate_save_dir = "~/.cache/vim/save_point"
let g:reanimate_default_category = "def"
let g:reanimate_default_save_name = "lat"

function s:reanimate_save_cwd() abort
  let l:cmd = "ReanimateSave " . fnamemodify(getcwd(), ":t")
  echom l:cmd
  exe l:cmd
endfunction

function s:reanimate_load_cwd() abort
  let l:cmd = "ReanimateLoad " . fnamemodify(getcwd(), ":t")
  echom l:cmd
  exe l:cmd
endfunction

nnoremap <space>rs <cmd>call <SID>reanimate_save_cwd()<cr>
nnoremap <space>rl <cmd>call <SID>reanimate_load_cwd()<cr>
'''
```

簡単には、以下コマンドで名前をつけてセッションの `Save` , `Load` ができる。

```vim
" MySaveData という名前を付けて保存
:ReanimateSave MySaveData

" 保存した MySaveData を復元
:ReanimateLoad MySaveData
```

この `MySaveData` という名前指定するのがめんどいので、 `<space>rs` を押下すると自動でカレントディレクトリの名前で保存するようにしている。
`<space>rl` でロード。

別途、 [airblade/vim-rooter](https://github.com/airblade/vim-rooter) や、 [mattn/vim-findroot](https://github.com/mattn/vim-findroot) のプラグインを入れていると自動で `repository` 名前で保存できる。

---

#### 参考

- [reanimate.vim というプラグインをつくった - C++でゲームプログラミング](https://osyo-manga.hatenadiary.org/entry/20120214/1329223884)
