---
title: Windows でも editprompt したい！ AutoHotkey で自作する
date: 2025-12-29
layout: layouts/post.vto
tags:
  - windows
  - autohotkey
  - cli
  - gemini
  - claude
type: post
description: "Gemini CLI や Claude Code などの CLI ツールで、プロンプトを外部エディタで編集するための `editprompt` が Windows で使えなかったため、AutoHotkey で同様の機能を実装しました。"
---

Gemini CLI や Claude Code など、ターミナルで対話する AI ツールが増えてきました。
長文のプロンプトを入力する際、ターミナルの入力欄だけでは編集しづらいことがあります。

そんな時、[editprompt](https://github.com/kencx/editprompt) というツールを使うと、CLI の入力を一時的に `$EDITOR` (Vim など) で編集できるようになります。

しかし、残念ながらこのツールは Windows ではうまく動作しませんでした。
そこで、**AutoHotkey** を使って同様の機能を実装してみました。

## AutoHotkey スクリプト

実装したスクリプトは以下の通りです。
`Ctrl + e` を押すと、現在の入力をカットしてエディタを開き、保存して閉じるとターミナルにペーストされます。

```autohotkey
; EditPrompt
; https://github.com/kencx/editprompt
^e::
{
  Clipboard := ""
  Send "^a"
  Send "^x"
  ClipWait 1
  if ErrorLevel
  {
    MsgBox "Failed to copy text to clipboard."
    return
  }
  input := Clipboard
  editor := Environment.GetEnvironmentVariable("EDITOR")
  if (editor == "")
  {
    editor := "notepad.exe"
  }
  tmpFile := Environment.GetEnvironmentVariable("TEMP") . "\editprompt.txt"
  if FileExist(tmpFile)
  {
    FileDelete tmpFile
  }
  FileAppend input, tmpFile
  RunWait editor . " " . tmpFile
  output := FileRead(tmpFile)
  Clipboard := output
  Send "^v"
}
```

設定ファイル全体は [dotfiles](https://github.com/yukimemi/dotfiles/blob/9f6004a50d1edc7394a635c428ff03c4b1fed94c/win/AutoHotkey/AutoHotkey.ahk?plain=1#L289-L310) にもあります。

## 仕組み

やっていることは非常にシンプルです。

1.  `Ctrl + e` をフック。
2.  `Ctrl + a` (全選択) -> `Ctrl + x` (カット) を送信して、現在の入力をクリップボードへ。
3.  環境変数 `EDITOR` で指定されたエディタ (なければメモ帳) を取得。
4.  クリップボードの内容を一時ファイル (`%TEMP%\editprompt.txt`) に保存。
5.  `RunWait` でエディタを起動し、そのエディタが閉じられるまで待機。
6.  編集が終わってエディタが閉じられたら、一時ファイルの内容を読み込む。
7.  `Ctrl + v` (ペースト) を送信して、編集後のテキストをターミナルに戻す。

これで、Windows のターミナルでも Vim などの使い慣れたエディタで快適にプロンプトを書くことができます。
