---
title: PowerShell で abbr 展開
date: 2026-01-18 10:19:22
layout: layouts/post.vto
tags: ["pwsh", "powershell", "abbr"]
description: PowerShell で fish shell の abbr (abbreviation) のような機能を実装する方法。
type: post
---

PowerShell の `alias` は便利ですが、 fish shell の `abbr` や、 `zeno.zsh` のように入力した瞬間に展開される方が、履歴の可読性や実行コマンドの明示性の面でメリットがあります。

これを実現するために、`PSReadLine` のキーハンドラ機能を使って実装してみました。

## 実装方法

`$PROFILE` や、そこから読み込まれるモジュールファイルに以下のコードを追加します。

```powershell
  # --- Abbreviation Expansion ---
  $abbrs = @{
    "b"     = "cd .."
    "g"     = "git"
    "s"     = "jj status"
    "d"     = "jj diff"
    "o"     = "Start-Process"
    "a"     = "git add"
    "t"     = "exit"
    "which" = "Get-Command"
    "l"     = "Get-ChildItem"
    "la"    = "Get-ChildItem -Force"
    "c"     = "Clear-Host"
    "e"     = "nvim"
  }

  $expandAbbrLogic = {
    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    if ($cursor -gt 0) {
      $sub = $line.Substring(0, $cursor)
      if ($sub -match '(?<Word>\S+)$') {
        $word = $Matches['Word']
        if ($abbrs.ContainsKey($word)) {
          [Microsoft.PowerShell.PSConsoleReadLine]::Delete($cursor - $word.Length, $word.Length)
          [Microsoft.PowerShell.PSConsoleReadLine]::Insert($abbrs[$word])
        }
      }
    }
  }

  Set-PSReadLineKeyHandler -Key Spacebar -ViMode Insert -ScriptBlock {
    . $expandAbbrLogic
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert(' ')
  }.GetNewClosure()

  Set-PSReadLineKeyHandler -Key Enter -ViMode Insert -ScriptBlock {
    . $expandAbbrLogic
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
  }.GetNewClosure()
```

## 解説

### 略語辞書の定義
`$abbrs` ハッシュテーブルに、略語と展開後のコマンドを定義しています。
例えば `"g" = "git"` と定義しておくと、`g` と入力してスペースを押すと `git` に置き換わります。

自分は一文字コマンドをけっこうたくさん定義しています。
一文字でできるとすごい早くて便利！

### 展開ロジック
`$expandAbbrLogic` スクリプトブロックで実際の置換処理を行っています。

1.  `GetBufferState` で現在の入力行とカーソル位置を取得。
2.  カーソル直前の単語を正規表現 `(?<Word>\S+)$` で抽出。
3.  その単語が `$abbrs` に存在すれば、`Delete` で削除し `Insert` で展開後の文字列を挿入。

### キーハンドラの設定
`Set-PSReadLineKeyHandler` を使い、`Spacebar` (スペースキー) と `Enter` キーをフックしています。

*   **Spacebar**: 略語を展開してから、スペースを挿入します。これにより、`g` -> Space -> `git ` となり、続けて引数を入力できます。
*   **Enter**: コマンドの末尾で略語を使って即実行する場合（例: `exit` を `t` に割り当てて `t` -> Enter）のために、Enter キーでも展開処理を走らせてから `AcceptLine` (実行) しています。

## まとめ

エイリアスとは異なり、実際に実行されるコマンドが入力中に明示され、そのまま履歴に残るのがメリットです。
コマンドの打ち間違いにも気づきやすくなるため、よく使うコマンドを登録しておくと重宝します。
