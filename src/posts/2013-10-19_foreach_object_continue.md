---
title: powershell ForEach-Objectでcontinue
date: 2013-10-19
draft: false
tags:
  - powershell
  - ForEach-Object
layout: layouts/post.vto
type: post
description: "PowerShellのForEach-Objectループ内でcontinueを使用する際の注意点についてです。意図した動作をさせるためにreturnを使用する方法を解説しています。"
---


powershell の ForEach-Object で、continue しようと
したら、思ったように動かなかった話。

こんなコードを書いた。

```powershell
gci -r |
% {
   if ($_.Name -match "^tes.*") {
      continue
   }
   $_
}
```
<!-- more -->

現在のディレクトリ配下を再帰的に見て、ファイル名が tes
から始まるもの以外を 表示する・・・みたいな処理。 マッチした場合のみ、
continue して次の処理に行きたいのだが、この書き方だと、 break
したのと同じような動きになってしまい、初回マッチしたら、それ以降の処理
はされない。

やりたいことを満たすには、以下のように書けばいいみたい。

```powershell
gci -r |
% {
   if ($_.Name -match "^tes.*") {
      return
   }
   $_
}
```

continue の代わりに return を使う。

##### 参考:

[powershell - Why does continue behave like break in a Foreach-Object? - Stack Overflow](http://stackoverflow.com/questions/7760013/why-does-continue-behave-like-break-in-a-foreach-object)

