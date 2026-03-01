---
title: Neovim ターミナルの PowerShell で実現する「二段階 Esc」と視覚的モード管理
date: 2026-03-01 21:30:00
layout: layouts/post.vto
tags: ["Neovim", "PowerShell", "Terminal", "PSReadLine", "ToggleTerm"]
description: "Neovim の :terminal でシェルの vi キーバインドを快適に使うための、PowerShell 側の Esc 制御と Neovim 側の視覚的モード管理ハックを紹介します。"
type: post
---

Neovim の `:terminal` でシェル（PowerShell）を操作している時、シェルの `vi` キーバインドを有効にしていると「Esc キーの奪い合い」が発生します。

1.  シェルの挿入モードからノーマルモードに戻りたい（シェルの操作）。
2.  Neovim 自体のノーマルモードに戻って、ウィンドウ移動やバッファ切り替えをしたい（Neovim の操作）。

これをスムーズに行うための「二段階 Esc」設定が非常に快適だったので紹介します。

## 課題：Esc 一発で Neovim モードに戻ってしまう問題

通常、ターミナルモードで `Esc` を Neovim の `<C-\><C-n>`（モード抜け）にマッピングしてしまうと、シェルの `vi` モードとしての `Esc` が効かなくなります。これではシェルのコマンド履歴検索や行編集の恩恵を受けられません。

かといって、シェルの `vi` モードを活かすためにマッピングを外すと、Neovim 自体の操作に移るために毎回 `<C-\><C-n>` を打つ必要があり、これが地味にストレスです。

## 解決策：PowerShell 側での「二段階 Esc」実装

この問題は、PowerShell の `PSReadLine` で「現在のモード」を判定して `Esc` の挙動を変えることで解決できました。

具体的には、PowerShell のプロファイル（$PROFILE）に以下のような設定を追加しています。

```powershell
# PSReadLine の ViMode を利用
if ($env:NVIM) {
  # シェルがすでに Command (Normal) モードの時に Esc を押すと、
  # Neovim 本体のサーバに対してモード変更のリモート命令を送る
  Set-PSReadLineKeyHandler -Chord Escape -ViMode Command -ScriptBlock {
    & nvim --server $env:NVIM --remote-send "<C-\><C-n>"
  }
}
```

この設定により、以下のような流れるような操作が可能になります。

- **1回目の Esc**: シェルが `Insert` → `Command` モードに移行。シェルの `vi` 操作が可能になる。
- **2回目の Esc**: シェルがすでに `Command` モードなら、Neovim 本体が `Terminal-Normal` モードに移行。

今回は PowerShell での設定を紹介しましたが、`nvim --server` を利用したリモート送信自体は Neovim の標準的な機能です。そのため、zsh や bash など、他のシェルでも `bindkey` などを利用して「ノーマルモード中に Esc を押した時の挙動」をカスタマイズすれば、同様の「二段階 Esc」が実現可能と思われます。

## 視覚的なモード管理（Neovim 側）

二段階に分けたことで、「今どちらのノーマルモード（シェル or Neovim）にいるのか」を判別する必要があります。これを Neovim 側の `autocmd` で視覚的にサポートします。

![Neovim terminal double esc](/static/images/neovim-terminal-double-esc.gif)

```lua
-- Terminal-Normal モード（Neovim 制御下）になった時だけ枠線を赤く光らせる
vim.api.nvim_create_autocmd("TermLeave", {
  callback = function()
    if vim.bo.buftype == "terminal" then
      -- モードを抜けた（Terminal-Normal になった）時に ErrorMsg ハイライトを適用
      vim.wo.winhighlight = "FloatBorder:ErrorMsg"
    end
  end,
})

vim.api.nvim_create_autocmd("TermEnter", {
  callback = function()
    if vim.bo.buftype == "terminal" then
      -- 再びターミナル操作に戻った時にハイライトをクリア
      vim.wo.winhighlight = ""
    end
  end,
})
```

この設定（ここでは浮動ウィンドウの `FloatBorder` を想定）により、**「枠線が赤く光っていれば Neovim 操作モード」「そうでなければシェル操作モード」** と一目で判別できるようになります。

※ハイライトグループや適用先（`FloatBorder` や `StatusLine` など）は、自身のターミナルの開き方や好みに合わせて適宜調整してください。

## まとめ

この「二段階 Esc」と「視覚的なフィードバック」を組み合わせることで、ターミナル内での `vi` キーバインドの利便性を最大化しつつ、Neovim 本体の操作への復帰もストレスなく行えるようになりました。

ターミナル作業が多い Vimmer の方、特に PowerShell をメインに使っている方には非常におすすめのセットアップです。

## 参考設定（dotfiles）

実際の私の設定は、以下のリポジトリで公開しています。

### PowerShell (PSReadLine の Esc 制御)

https://github.com/yukimemi/dotfiles/blob/517a49b5b0ce1472ad66a77af9f7df2f90233591/dot_config/powershell/LazyProfile.psm1#L339-L341

### Neovim (autocmd による枠線の可視化)

https://github.com/yukimemi/dotfiles/blob/517a49b5b0ce1472ad66a77af9f7df2f90233591/dot_config/nvim/rc/after/toggleterm.lua#L54-L72

