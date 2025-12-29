---
title: Global abbreviation on fish
date: 2020-01-30T21:56:00+09:00
draft: false
tags:
  - fish
  - abbreviation
  - fisher
layout: layouts/post.vto
type: post
description: "fish shellでzshのグローバルエイリアスのような機能を実現する「fish-global-abbreviation」プラグインの導入と、Enterキーで展開するためのキーバインド設定についてです。"
---


`zsh` ではできるグローバルエイリアス。
これを `fish` でもできるようにしたプラグインが

[ryotako/fish-global-abbreviation](https://github.com/ryotako/fish-global-abbreviation)

<!-- more -->

設定の方法は、 [fishでグローバルエイリアスっぽいもの - Qiita](https://qiita.com/ryotako/items/83812c2a703b965a02d9) を見るといい感じ。

ただ、この設定だと、 Space とかでは展開されるんだけど、 `zsh` みたいに `Enter` で展開することができなかった。

なので、以下の設定を `fish_user_key_bindings.fish` に実施した。

```bash
function fish_user_key_bindings

    # Additional bind for fish_vi_key_bindings.
    bind -M insert \cf accept-autosuggestion
    bind -M insert \cn down-or-search
    bind -M insert \cp up-or-search

    # global abbreviation.
    bind -M insert ' ' '__gabbr_expand; commandline -i " "'
    bind -M insert ';' '__gabbr_expand; commandline -i ";"'
    bind -M insert '>' '__gabbr_expand; commandline -i ">"'
    bind -M insert '<' '__gabbr_expand; commandline -i "<"'
    bind -M insert '(' '__gabbr_expand; commandline -i "("'
    bind -M insert ')' '__gabbr_expand; commandline -i ")"'
    bind -M insert \cj '__gabbr_expand; commandline -f execute'
    bind -M insert \cm '__gabbr_expand; commandline -f execute'
    bind -M insert \r  '__gabbr_expand; commandline -f execute'
end
```

重要なのは、一番下3行。
`__gabbr_expand` だけじゃなくて、 `commandline -f execute` を追加するのいいみたい。


## 参考
- - -
- [ryotako/fish-global-abbreviation: Global abbreviation for fish shell](https://github.com/ryotako/fish-global-abbreviation)
- [fishでグローバルエイリアスっぽいもの - Qiita](https://qiita.com/ryotako/items/83812c2a703b965a02d9)
- [masa0x80/dotfiles: my dotfiles](https://github.com/masa0x80/dotfiles)

