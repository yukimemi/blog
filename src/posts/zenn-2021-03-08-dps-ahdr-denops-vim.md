---
title: ヘッダー追加する vim plugin (denops.vim で！)
date: 2021-03-08
draft: false
tags:
  - vim
  - neovim
  - denops
layout: layouts/post.vto
type: post
zenn_type: tech
description: "DenoでVimプラグインを書ける「denops.vim」を使って、ファイルにヘッダーを追加するプラグイン「dps-ahdr」を作成しました。"
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/dps-ahdr-denops-vim) にも投稿しています。

## denops.vim とは

`Alisue` さんが作成している、 [Deno](https://deno.land/) を使って Vim / Neovim のプラグインが書けるフレームワークです。

[Deno を使って Vim/Neovim のプラグインを書く by denops.vim](https://zenn.dev/lambdalisue/articles/b4a31fba0b1ce95104c9)

せっかくなので、これを使って plugin 作ってみました。

## [yukimemi/dps-ahdr](https://github.com/yukimemi/dps-ahdr)

作った plugin は、 現在のバッファにヘッダーを追加するようなやつです。

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

## PowerShell をダブルクリックで実行可能に (Set-ExecutionPolicy 不要)

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

## バッチファイルをダブルクリックで管理者権限で実行可能に

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

これらのヘッダー追加定義は toml で設定してあり、デフォルトの定義は現状以下の設定になっています。

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

今開いているバッファの `fenc` と `ff` を保持したかったから、 [Deno](https://deno.land/) で書いてるのに、結局 `vim` の関数でほとんど実施している・・・。あんまり Deno で書く意味はなかった・・・？ `(・_・;)` でも、 `toml` で書いた設定を簡単に読み込めたりするのは [Deno](https://deno.land/) の利点じゃないかな！！
うまいこと `fenc` と `ff` を [Deno](https://deno.land/) 使いながら保持できるんやろうか・・・。うまい書き方が全然わかっていない・・・。

---

### 参考

- [Deno - A secure runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write plugins in Deno](https://github.com/vim-denops/denops.vim)
- [vim-denops/denops-helloworld.vim: An example plugin of denops.vim](https://github.com/vim-denops/denops-helloworld.vim)
- [std@0.89.0 | Deno](https://deno.land/std@0.89.0/encoding#toml)
- [gamoutatsumi/denops-ojichat.vim: ojichat plugin of vim](https://github.com/gamoutatsumi/denops-ojichat.vim)
