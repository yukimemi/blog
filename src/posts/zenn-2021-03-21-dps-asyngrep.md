---
title: 非同期にGrep検索する (denops.vim)
date: 2021-03-21
draft: false
tags:
  - vim
  - neovim
  - denops
layout: layouts/post.vto
type: post
zenn_type: tech
description: "「denops.vim」を使って、`ripgrep`や`jvgrep`などで非同期にGrep検索を行うプラグイン「dps-asyngrep」を作成しました。"
---


相変わらず [denops.vim](https://github.com/vim-denops/denops.vim) たのしい！

ってことで、また作ってみました。
[ripgrep](https://github.com/BurntSushi/ripgrep) や [the_platinum_searcher](https://github.com/monochromegane/the_platinum_searcher) や [jvgrep](https://github.com/mattn/jvgrep) で非同期に grep できるプラグイン。

https://github.com/yukimemi/dps-asyngrep

**Denops Asynchronous Grep** -> **dps-asyngrep**

[![asciicast](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv.svg)](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv)

[tsuyoshicho/vim-fg](https://github.com/tsuyoshicho/vim-fg) のパクｒ (じゃなくてインスパイア・・・めちゃめちゃ参考になりました、ありがとうございます！)

<!-- more -->

## インストール

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'vim-denops/denops.vim'

[[plugins]]
repo = 'yukimemi/dps-asyngrep'
hook_add = '''
" let g:asyngrep_debug = v:true
" let g:asyngrep_cfg_path = "~/.asyngrep.toml"

nnoremap <space>ss <cmd>Agp<cr>
nnoremap <space>sr <cmd>Agp --tool=ripgrep<cr>
nnoremap <space>sp <cmd>Agp --tool=pt<cr>
nnoremap <space>sj <cmd>Agp --tool=jvgrep<cr>
'''
```

依存として、 [denops.vim](https://github.com/vim-denops/denops.vim) が必要。(もちろん [Deno](https://deno.land/) も。)

また、 grep に使用するツールとして、以下 3 つのどれかは必要。

- [ripgrep](https://github.com/BurntSushi/ripgrep)
- [jvgrep](https://github.com/mattn/jvgrep)
- [the_platinum_searcher](https://github.com/monochromegane/the_platinum_searcher)

設定は特に不要だが、上記コメントアウトしているように追加設定ができます。

- `g:asyngrep_debug`

デバッグログ出力有無。デフォルト: `v:false`
調査で必要な時 `v:true` にすると、ログが `echomsg` される。

- `g:asyngrep_cfg_path`

後述する grep tool の設定を自分で上書きしたい場合に設定ファイルパスを指定する。
デフォルト: `~/.asyngrep.toml`

## 使い方

インストールすると、 `Agp` コマンドが使えるようになる。 (`Asynchronous GreP`)
以下の順番でインストールされているツールから、一番最初に見つかったものを使用して検索を行う。

1. [ripgrep](https://github.com/BurntSushi/ripgrep)
2. [jvgrep](https://github.com/mattn/jvgrep)
3. [the_platinum_searcher](https://github.com/monochromegane/the_platinum_searcher)

検索は非同期で実行され、見つかったものから逐次 `quickfix` に出力される。
(1 行ずつ `setqflist` を実行しているので、これは [Alisue さん曰く、めちゃめちゃ遅いらしい・・・。](https://vim-jp.org/slacklog/C01N4L5362D/2021/03/#ts-1616229128.029100) バッファリングについて検討中。)

ツールを個別に指定する場合は、以下のように `--tool` オプションで指定する。

```vim
:Agp --tool=jvgrep
```

## 設定

3 種類のツールは以下設定で定義されている。

```toml
[[tool]]
name = "ripgrep"
cmd = "rg"
arg = ["-i", "--vimgrep", "--no-heading"]

[[tool]]
name = "jvgrep"
cmd = "jvgrep"
arg = ["-i", "--no-color", "-I", "-R", "-8"]

[[tool]]
name = "pt"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor"]
```

なんとなく見てもらえればわかるかなと・・・。

上記の引数を上書きたい場合や別のツールを追加したい場合は自分で設定ファイルを記載する。

- `~/.asyngrep.toml`

```toml
[[tool]]
name = "ripgrep"
cmd = "rg"
arg = ["-i", "--vimgrep", "--no-heading", "--hidden", "--no-ignore", "--regexp"]

[[tool]]
name = "jvgrep"
cmd = "jvgrep"
arg = ["-i", "--no-color", "-I", "-R", "-8"]

[[tool]]
name = "default"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor", "--smart-case", "--skip-vcs-ignores", "--hidden"]
```

`name` に `default` を指定すると、記載順序関係なく、そのツールがデフォルト (`--tool` オプションなし) で使用されるツールになる。
上記の場合は引数なしの `Agp` で [the_platinum_searcher](https://github.com/monochromegane/the_platinum_searcher) が使用されるようになる。

こんなツールも [denops.vim](https://github.com/vim-denops/denops.vim) を使えばサクッと作ることができてひじょーにべんり。

作るの自体は本当 1 日でサクッといけたんだけど、ちょっと Vim と Neovim で挙動が異なるところがあり、どうにも解決できずに [vim-jp slack](https://vim-jp.slack.com/) で質問したところ、 Alisue さんがサクッとプルリクくれて直りました。ほんとあざました！感謝。

まだ色々足りてない機能あるのでおいおい追加していきたい。

---

#### 参考

- [tsuyoshicho/vim-fg](https://github.com/tsuyoshicho/vim-fg)
- [yukimemi/dps-asyngrep](https://github.com/yukimemi/dps-asyngrep)
- [vim-jp slack](https://vim-jp.slack.com/)
- [vim-jp » vim-jp.slack.com log - #tech-denops - 2021 年 03 月](https://vim-jp.org/slacklog/C01N4L5362D/2021/03/#ts-1616229128.029100)
