---
title: Use alacritty
date: 2020-04-11T12:30:03+09:00
draft: false
tags:
  - terminal
  - alacritty
layout: layouts/post.vto
type: post
description: "GPUアクセラレーション対応のターミナル「Alacritty」の導入と設定（yaml形式）についてです。alacritty-colorschemeを使ったテーマ切り替え設定も紹介しています。"
---


[alacritty/alacritty: A cross-platform, GPU-accelerated terminal emulator](https://github.com/alacritty/alacritty)
を使う。

<!-- more -->

昔も使ったことはあるんだけど、なぜか前は `<C-u>` が使用できなくてその時は `iTerm2` に戻ってた。
でもやっぱり `Rust` 製だし使いたいってことで使ってみた。

インストールは `homebrew` でかんたん。

```bash
brew cask install alacritty
```

設定はすべて `yaml` でするみたい。

必要なとこだけ抜粋するとこんな感じ。

- ~/.config/alacritty/alacritty.yml

```yaml
window:
  padding:
    x: 5
    y: 5
  decorations: buttonless
  startup_mode: Maximized
  title: Alacritty

scrolling:
  history: 10000
  multiplier: 3

font:
  normal:
    family: cica
    style: Regular
  size: 18.0

# [toggle-corp/alacritty-colorscheme: Change colorscheme of alacritty with ease.](https://github.com/toggle-corp/alacritty-colorscheme)
# color_start
# color_end

background_opacity: 0.8

cursor:
  style: Block

live_config_reload: true

shell:
  program: /usr/local/bin/fish
```

`theme` は、上のコメントにあるように、
[alacritty-colorscheme](https://github.com/toggle-corp/alacritty-colorscheme) を使用する。
`alacritty.yml` 内に

```yaml
# color_start
# color_end
```

とコメントを書いておくと、その中を置き換えてくれる。

インタラクティブに変更できるように、 `fish` 関数を書いておいた。

- ~/.config/fish/functions/\_\_filter_command.fish

```bash
function __filter_command
  if type -q sk
    sk
  else if type -q gof
    gof
  else if type -q peco
    peco
  else if type -q fzf-tmux
    fzf-tmux
  else if type -q fzf
    fzf
  else if type -q fzy
    fzy -l 200
  else
    echo "Filter command not found ! Please install sk/fzf/fzy/peco."
    return 1
  end
end
```

- ~/.config/fish/functions/\_\_echo.fish

```bash
function __echo
  if test (count $argv) -gt 1
    echo "
    ------
    $argv[1]: $argv[2]
    ------
    "
  end
end
```

- ~/.config/fish/functions/alacritty-toggle-alacritty-theme.fish

```bash
function alacritty-toggle-alacritty-theme
  if not test -d ~/.eendroroy-alacritty-theme
    git clone https://github.com/eendroroy/alacritty-theme.git ~/.eendroroy-alacritty-theme
  end
  if not type -q alacritty-colorscheme
    pip install git+https://github.com/toggle-corp/alacritty-colorscheme.git
  end
  alacritty-colorscheme -C ~/.eendroroy-alacritty-theme/themes -l | __filter_command | read -l line
  and __echo "Change colorscheme" $line
  and alacritty-colorscheme -C ~/.eendroroy-alacritty-theme/themes -a $line
end
```

- ~/.config/fish/functions/alacritty-toggle-base16-alacritty.fish

```bash
function alacritty-toggle-base16-alacritty
  if not test -d ~/.aaron-williamson-alacritty-theme
    git clone https://github.com/aaron-williamson/base16-alacritty.git ~/.aaron-williamson-alacritty-theme
  end
  if not type -q alacritty-colorscheme
    pip install git+https://github.com/toggle-corp/alacritty-colorscheme.git
  end
  alacritty-colorscheme -C ~/.aaron-williamson-alacritty-theme/colors -l | __filter_command | read -l line
  and __echo "Change colorscheme" $line
  and alacritty-colorscheme -C ~/.aaron-williamson-alacritty-theme/colors -a $line
end
```

これで、かんたんに `theme` 変更ができる。

![alacritty](/static/images/alacritty-theme-change.gif)

[Terminalizer](https://terminalizer.com/) で録ったやつやから変わってないように見えるけど、実際は変わってるの・・・

## 参考

- [alacritty/alacritty: A cross-platform, GPU-accelerated terminal emulator](https://github.com/alacritty/alacritty)
- [toggle-corp/alacritty-colorscheme: Change colorscheme of alacritty with ease.](https://github.com/toggle-corp/alacritty-colorscheme)
