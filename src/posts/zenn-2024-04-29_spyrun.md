---
title: Rust でファイル変更検知して何か処理を実行する (spyrun)
date: 2024-04-29
draft: true
tags:
  - rust
  - spyrun
  - notify
layout: layouts/post.vto
type: post
zenn_type: tech
---

## はじめに

ファイルの作成、変更、削除などを検知して、何か処理を実行する、というのはビルドツールやタスクランナーとして使用頻度が高いと思います。
色んな場面で使用できると思い、 `Rust` の練習がてら作ってみることにしました。

https://github.com/yukimemi/spyrun

`spyrun` は、ファイルの変更を検知して何か処理を実行するためのツールです。

## インストール

以下コマンドを実行してインストールしてください。

```sh
cargo install spyrun
```

## 使い方



