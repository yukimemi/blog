---
title: HotKey App
date: 2020-04-12T10:29:03+09:00
draft: false
tags:
  - mac
  - hotkey
  - autohotkey
layout: layouts/post.vto
type: post
---


Windows では、 [AutoHotkey](https://www.autohotkey.com/) を使用して以下のような感じでアプリを呼び出すようにしている。

<!-- more -->

| No | key   | app                                                                                                | toggle |
|----|-------|----------------------------------------------------------------------------------------------------|--------|
| 1  | F9    | [Excel](https://products.office.com/ja-jp/excel)                                                   | false  |
| 2  | F10   | [Neovim](https://neovim.io/)                                                                       | false  |
| 3  | F11   | [Edge](https://www.microsoft.com/ja-jp/edge)                                                       | false  |
| 4  | F12   | [Terminus](https://eugeny.github.io/terminus/)                                                     | true   |
| 5  | C-F9  | [Outlook](https://products.office.com/ja-jp/outlook/email-and-calendar-software-microsoft-outlook) | false  |
| 6  | C-F10 | [サクラエディタ](https://sakura-editor.github.io/)                                                 | false  |
| 7  | C-F11 | [Teams](https://products.office.com/ja-jp/microsoft-teams/group-chat-software)                     | false  |


`Terminal` としての役割である [Terminus](https://eugeny.github.io/terminus/) だけ、 toggle できるようにしている。
[AutoHotkey](https://www.autohotkey.com/) の設定で以下のような設定をしている。


```bash
Toggle(app) {
  SplitPath, app, file
  Process, Exist, %file%
  if ErrorLevel <> 0
    if WinActive("ahk_pid" . ErrorLevel)
      WinMinimize, A
    else
      WinActivate, ahk_pid %ErrorLevel%
  else
    Run, %app%
  return
}

Activate(app) {
  SplitPath, app, file
  Process, Exist, %file%
  if ErrorLevel <> 0
      WinActivate, ahk_pid %ErrorLevel%
    else
      Run, %app%
  return
}

; for Excel
F9::
Activate("C:\Program Files (x86)\Microsoft Office\Office16\EXCEL.EXE")
return

; for Outlook
^F9::
Activate("C:\Program Files (x86)\Microsoft Office\Office16\OUTLOOK.EXE")
return

; for neovim
F10::
Activate(USERPROFILE . "\scoop\apps\neovim\current\bin\nvim.exe")
return

; for sakura
^F10::
Activate("C:\Program Files\sakura\sakura.exe")
return

; for Edge
F11::
Activate("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
return

; for Teams
^F11::
Activate(APPDATA . "Local\Microsoft\Teams\current\Teams.exe")
return

; for Terminus
F12::
Toggle(USERPROFILE . "\AppData\Local\Programs\Terminus\Terminus.exe")
return
```

これと同じようなことを mac でもできないかなぁーググってたところ、そのものズバリなものがあること発見！

[HotKey App](https://codenuts.de/en/posts/hotkey/)

使い方は以下のサイトがわかりやすかった。
GUI で設定できるので非常にかんたん。 toggle の有無もチェックボックス入れるだけ。
これは mac での必須アプリとなりそう。

[macアプリに自分の好きなホットキーを設定して素早く起動できる「HotKey」 | 山田どうそんブログ](https://triggermind.com/mac-app/hotkey/)

## 参考

[AutoHotkey](https://www.autohotkey.com/)
[HotKey App](https://codenuts.de/en/posts/hotkey/)
[macアプリに自分の好きなホットキーを設定して素早く起動できる「HotKey」 | 山田どうそんブログ](https://triggermind.com/mac-app/hotkey/)
