---
title: 必要な時のみ cursorline cursorcolumn する (denops.vim で！)
date: 2021-03-13
draft: false
description: "「denops.vim」を使って、`cursorline`や`cursorcolumn`を必要な時だけ有効にするプラグイン「dps-autocursor」を作成しました。"
taxonomies:
  tags: ["denops", "neovim", "vim"]
extra:
  type: post
  zenn_type: tech
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/2021-03-13-dps-autocursor-vim) にも投稿しています。

https://github.com/vim-denops/denops.vim

たのしい！

ってことで、また作ってみました。

https://github.com/yukimemi/dps-autocursor

[![asciicast](https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs.svg)](https://asciinema.org/a/rRXjQa16Iwchj4NfaUTNPTFEs)

Vim には `cursorline` `cursorcolumn` というオプションがあり、それぞれ、カーソルがある位置を示してくれる。
しかしながら、常時これを ON にしているとなかなか処理も重くなるし、見た目もうざったい。
そこで、必要なときのみ ON にするっていう方法が、 `thinca` さんの超有名な記事に記載されている。

https://thinca.hatenablog.com/entry/20090530/1243615055

これを少し変えて、 [denops.vim](https://github.com/vim-denops/denops.vim) 使ってかいてみた。

`thinca` さんの記事では、 `WintEnter` `CursorHold` などのイベント時に `set cursorline` 設定され、 `CursorMoved` などで `set nocursorline` されるが、どのイベント発生時に設定を X 秒ウェイトして設定する、しないというのを設定できるようにすればいいのでは？
と思い、以下の設計にしている。

例えば・・・

| イベント名  | ウェイト | 設定  |
| ----------- | -------- | ----- |
| CursorHold  | 500      | true  |
| CursorMoved | 0        | false |
| WinEnter    | 0        | true  |

こんな設定だと、

- `CursorHold` 発生時

  500 ms 後に `set cursorline`

- `CursorMoved` 発生時

  0 ms 後に `set nocursorline`

- `WinEnter` 発生時

  0 ms 後に `set cursorline`

ということになる。

そしてこれは、 [denops.vim](https://github.com/vim-denops/denops.vim) だと `setTimeout` を使用してめちゃ簡単にかけるのでは？
と思い作成にいたりました。(実際簡単だった)

## インストール

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'vim-denops/denops.vim'

[[plugins]]
repo = 'yukimemi/dps-autocursor'
hook_add = '''
" let g:autocursor_debug = v:true
let g:autocursor_cursorline = {
  \ "enable": v:true,
  \ "events": [
  \   {
  \     "name": "FocusGained",
  \     "set": v:true,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorHold",
  \     "set": v:true,
  \     "wait": 100,
  \   },
  \   {
  \     "name": "TextYankPost",
  \     "set": v:true,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorMoved",
  \     "set": v:false,
  \     "wait": 500,
  \   }
  \  ]
  \ }
let g:autocursor_cursorcolumn = {
  \ "enable": v:true,
  \ "events": [
  \   {
  \     "name": "FocusGained",
  \     "set": v:true,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorHold",
  \     "set": v:true,
  \     "wait": 200,
  \   },
  \   {
  \     "name": "TextYankPost",
  \     "set": v:true,
  \     "wait": 0,
  \   },
  \   {
  \     "name": "CursorMoved",
  \     "set": v:false,
  \     "wait": 500,
  \   }
  \  ]
  \ }
```

`hook_add` の設定はなくても問題ない。
依存として、 [denops.vim](https://github.com/vim-denops/denops.vim) が必要。(もちろん [Deno](https://deno.land/) も。)

`hook_add` に記載があるように、 `cursorline`, `cursorcolumn` それぞれでどのタイミングで設定をする、しないを定義することができる。

```vim
let g:autocursor_cursorline = {
  \ "enable": v:true,            // cursorline 設定をするかどうか。
  \ "events": [                  // (cursorline だけ設定して cursorcolumn は設定したくない、等の場合に設定する)
  \   {
  \     "name": "CursorMoved",   // 設定するイベント名
  \     "set": v:false,          // cursorline or nocursorline
  \     "wait": 500,             // 設定するまでのウェイト時間 (ms)
  \   }
  \  ]
  \ }
```

デフォルトだと以下の設定になっている。

- cursorline

| イベント名   | ウェイト | 設定  |
| ------------ | -------- | ----- |
| CursorHold   | 500      | true  |
| CursorHoldI  | 500      | true  |
| WinEnter     | 0        | true  |
| BufEnter     | 0        | true  |
| CmdwinLeave  | 0        | true  |
| CursorMoved  | 0        | false |
| CursorMovedI | 0        | false |

- cursorcolumn

| イベント名   | ウェイト | 設定  |
| ------------ | -------- | ----- |
| CursorHold   | 500      | true  |
| CursorHoldI  | 500      | true  |
| WinEnter     | 0        | true  |
| BufEnter     | 0        | true  |
| CmdwinLeave  | 0        | true  |
| CursorMoved  | 0        | false |
| CursorMovedI | 0        | false |

上書きしたい場合は、先程の `hook_add` 記載のように設定を行う。
例えば上記の設定だと、 `cursorline` と `cursorhold` で別の `wait` を設定しているので `CursorHold` イベント時 `100ms` 後に `cursorline` 、 `200ms` 後に `set cursorcolumn` となる。
グランドクロス！！
みたいな感じでかっこいい！(よくわからん)

また、解除も `500ms` ウェイトを設けているので、 `CursorMoved` イベント発生ですぐ消えるのではなく動かすとしばらくしてから `cursorline` `cursorcolumn` 消えるっていう面白い動きなる。

## コマンド

コマンドとして設定、解除するのを設けている。

```vim
:EnableAutoCursorLine    " cursorline 設定を有効化
:EnableAutoCursorColumn  " cursorcolumn 設定を有効化
:DisableAutoCursorLine   " cursorline 設定を無効化
:DisableAutoCursorColumn " cursorcolumn 設定を無効化
```

---

### 参考

- [Deno - A secure runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write plugins in Deno](https://github.com/vim-denops/denops.vim)
- [vim-denops/denops-helloworld.vim: An example plugin of denops.vim](https://github.com/vim-denops/denops-helloworld.vim)
- ['cursorline' を必要な時にだけ有効にする - 永遠に未完成](https://thinca.hatenablog.com/entry/20090530/1243615055)
- [【Vim】必要な時だけカーソル行をハイライトする - Qiita](https://qiita.com/delphinus/items/a05f6f21dd494bad9f25)
