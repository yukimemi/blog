---
title: About
template: page.html
date: 2025-01-01
hidden: true
---

# yukimemi

Vim / Neovim と Rust で道具を作っています。
作ったものと、その過程で調べたこと・つまずいたことを、2013 年からここに書きためています。

## 作っているもの

- **プラグインマネージャー** — 今は [rvpm](https://github.com/yukimemi/rvpm)。Rust 製で、`config.toml` から `loader.lua` を事前コンパイルする CLI ファーストな設計です。その前は Deno + denops で設定を TypeScript で書く [dvpm](https://github.com/yukimemi/dvpm) を使っていました。
- **Vim / Neovim プラグイン** — [denops.vim](https://github.com/vim-denops/denops.vim) を使い TypeScript で書いた `dps-` で始まる一連の小さなプラグイン群。
- **CLI ツール** — Rust。ガントチャート・ToDo の [yaiba](https://github.com/yukimemi/yaiba)、dotfiles マネージャーの [yui](https://github.com/yukimemi/yui)、プロジェクトテンプレートの [kata](https://github.com/yukimemi/kata)、ディスパッチャの [todoke](https://github.com/yukimemi/todoke) など。
- **環境の整備** — PowerShell、dotfiles、ターミナルまわり。

## 記事について

内容は Vim / Neovim、Rust、PowerShell、シェル環境が中心です。
古い記事は当時のまま残してあり、今では通用しない手順も含みます。日付を見て読んでください。

タグから辿るのが早いと思います。[tags](/tags/) に何をどれだけ書いたかが出ています。
一部の記事は [Zenn](https://zenn.dev/yukimemi) にも投稿しています。
