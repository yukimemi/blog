---
title: Windows でも editprompt したい！ AutoHotkey で自作する
date: 2025-12-29 12:00:00
layout: layouts/post.vto
tags:
  - windows
  - autohotkey
  - cli
  - gemini
type: post
description: "Gemini CLI や Claude Code などの CLI ツールで、プロンプトを外部エディタで編集するための `editprompt` が Windows で使えなかったため、AutoHotkey で同様の機能を実装しました。"
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/2025-12-29-editprompt-on-windows-with-autohotkey) にも投稿しています。

Gemini CLI や Claude Code など、ターミナルで対話する AI ツールが増えてきました。
長文のプロンプトを入力する際、ターミナルの入力欄だけでは編集しづらいことがあります。

そんな時、[editprompt](https://github.com/eetann/editprompt) というツールを使うと、CLI の入力を一時的に `$EDITOR` (Vim など) で編集できるようになります。

しかし、残念ながらこのツールは Windows では動作しないようです。
そこで、**AutoHotkey** を使って同様の機能を実装してみました。

## AutoHotkey スクリプト

実装したスクリプトは以下の通りです。
`F7` を押すと、エディタを開き、保存して閉じるとターミナルにペーストされます。

https://github.com/yukimemi/dotfiles/blob/9f6004a50d1edc7394a635c428ff03c4b1fed94c/win/AutoHotkey/AutoHotkey.ahk?plain=1#L289-L310

editor は nvim 固定で書いちゃってるけど、そこを変えれば他のでもいけるはず！

これで、Windows のターミナルでも Vim などの使い慣れたエディタで快適にプロンプトを書くことができます。
