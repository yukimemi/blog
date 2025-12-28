---
title: dps-ahdr plugin with Denops (Deno)
date: 2021-03-07T22:54:02+09:00
draft: false
tags:
  - vim
  - neovim
  - deno
  - denops
layout: layouts/post.vto
type: post
---


[Deno](https://deno.land/) で vim plugin が書ける、 [vim-denops/denops.vim](https://github.com/vim-denops/denops.vim) っていうすごい plugin があるのです。
せっかくなので、これを使って plugin 作ってみました。

[yukimemi/dps-ahdr](https://github.com/yukimemi/dps-ahdr)

<!-- more -->

作った plugin は、 現在のバッファにヘッダーを追加するやつ。

**Denops Add Header** -> **dps-ahdr**

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

- dein.toml

```toml
[[plugins]]
repo = 'vim-denops/denops.vim'

[[plugins]]
repo = 'yukimemi/dps-ahdr'
hook_add = '''
" let g:ahdr_debug = v:true
" let g:ahdr_cfg_path = "~/.ahdr_my_settings.toml"
'''
```

依存として、 [denops.vim](https://github.com/vim-denops/denops.vim) が必要。(もちろん [Deno](https://deno.land/) も。)

どんなときに使うかというと、例えば、 `PowerShell` を書いていて、このスクリプトすぐ実行できる実行形式にしたい！ってときに使えます。

- hello.ps1

```powershell
Write-Host "Hello world !"
```

こんな `hello.ps1` ファイルを作成しても、なぜか `ps1` ファイルはダブルクリックしてもメモ帳が開くだけ・・・。

そこで、 vim / neovim でこの hello.ps1 を開いているときに以下コマンドを実行すると・・・。

```vim
:DenopsAhdr default
```

こんなファイルが出来上がり、ダブルクリックで実行できるようになります。

- hello.cmd

```powershell
@set __SCRIPTPATH=%~f0&@powershell -NoProfile -ExecutionPolicy ByPass -InputFormat None "$s=[scriptblock]::create((gc -enc utf8 -li \"%~f0\"|?{$_.readcount -gt 2})-join\"`n\");&$s" %*
@exit /b %errorlevel%
Write-Host "Hello world !"
```

他にも・・・。

- regadd.bat

```text
reg add HKLM\Environment /v myvar /t reg_sz /d "Hello!"
```

というバッチ実行したくても、そのままじゃ管理者権限なく実行できない！！

そこで・・・

```vim
:DenopsAhdr admin
```

とすると、こんなファイルができあがり、ダブルクリックで UAC 昇格実行できる。

- regadd_a.bat

```text
@openfiles > nul 2>&1
@if %errorlevel% equ 0 goto :ALREADY_ADMIN_PRIVILEGE
@powershell.exe -Command Start-Process '%~f0' %* -verb runas
@exit /b %errorlevel%
:ALREADY_ADMIN_PRIVILEGE
reg add HKLM\Environment /v myvar /t reg_sz /d "Hello!"
```

これらのヘッダー追加定義は toml で設定してあり、デフォルトの定義は現状以下の設定になっている。

```toml
[[ps1]]
name = "default"
prefix = ""
suffix = ""
ext = ".cmd"
header = '''
@set __SCRIPTPATH=%~f0&@powershell -NoProfile -ExecutionPolicy ByPass -InputFormat None "$s=[scriptblock]::create((gc -enc utf8 -li \\"%~f0\\"|?{$_.readcount -gt 2})-join\\"`n\\");&$s" %*
@exit /b %errorlevel%
'''

[[ps1]]
name = "pause"
prefix = ""
suffix = "_p"
ext = ".cmd"
header = '''
@set __SCRIPTPATH=%~f0&@powershell -NoProfile -ExecutionPolicy ByPass -InputFormat None "$s=[scriptblock]::create((gc -enc utf8 -li \\"%~f0\\"|?{$_.readcount -gt 2})-join\\"`n\\");&$s" %*&@pause
@exit /b %errorlevel%
'''

[[ps1]]
name = "wait"
prefix = ""
suffix = "_w"
ext = ".cmd"
header = '''
@set __SCRIPTPATH=%~f0&@powershell -NoProfile -ExecutionPolicy ByPass -InputFormat None "$s=[scriptblock]::create((gc -enc utf8 -li \\"%~f0\\"|?{$_.readcount -gt 2})-join\\"`n\\");&$s" %*&@ping -n 30 localhost > nul
@exit /b %errorlevel%
'''

[[javascript]]
name = "default"
prefix = ""
suffix = ""
ext = ".cmd"
header = '''
@set @junk=1 /*
@cscript //nologo //e:jscript "%~f0" %*
@exit /b %errorlevel%
*/
'''

[[javascript]]
name = "pause"
prefix = ""
suffix = "_p"
ext = ".cmd"
header = '''
@set @junk=1 /*
@cscript //nologo //e:jscript "%~f0" %*
@pause
@exit /b %errorlevel%
*/
'''

[[javascript]]
name = "wait"
prefix = ""
suffix = "_w"
ext = ".cmd"
header = '''
@set @junk=1 /*
@cscript //nologo //e:jscript "%~f0" %*
@ping -n 30 localhost > nul
@exit /b %errorlevel%
*/
'''

[[dosbatch]]
name = "admin"
prefix = ""
suffix = "_a"
ext = ".bat"
header = '''
@openfiles > nul 2>&1
@if %errorlevel% equ 0 goto :ALREADY_ADMIN_PRIVILEGE
@powershell.exe -Command Start-Process \'%~f0\' %* -verb runas
@exit /b %errorlevel%
:ALREADY_ADMIN_PRIVILEGE
'''
```

- [[filetype]]: vim の `filetype`。
- name: `DenopsAhdr` コマンドの引数に指定する名前。この名前かつ、 `filetype` で合致した設定を使う。
- prefix: 保存するファイル名の頭につける文字。
- suffix: 保存するファイル名のお尻につける文字。
- ext: 保存するファイルの拡張子。
- header: 追加するヘッダー。

上記の `toml` はデフォルト設定なので変更はできない。
追加したい場合はデフォルトだと、 `~/.ahdr.toml` に自分の好きな設定を記載すれば追加で読み込まれる。
もしくは別の場所にしたい場合は、 `g:ahdr_cfg_path` で指定する。

今開いているバッファの `fenc` と `ff` を保持したかったから、 [Deno](https://deno.land/) で書いてるのに、結局 `vim` の関数でほとんど実施している・・・。あんまり Deno で書く意味はなかった・・・？ `(・_・;)` でも、 `toml` で設定書くのが簡単に読み込めたりするのは [Deno](https://deno.land/) の利点じゃないかな！！
うまいこと `fenc` と `ff` を [Deno](https://deno.land/) 使いながら設定できるんやろうか・・・。うまい書き方が全然わかっていない・・・。

---

### 参考

- [Deno - A secure runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write plugins in Deno](https://github.com/vim-denops/denops.vim)
- [vim-denops/denops-helloworld.vim: An example plugin of denops.vim](https://github.com/vim-denops/denops-helloworld.vim)
- [std@0.89.0 | Deno](https://deno.land/std@0.89.0/encoding#toml)
- [gamoutatsumi/denops-ojichat.vim: ojichat plugin of vim](https://github.com/gamoutatsumi/denops-ojichat.vim)
