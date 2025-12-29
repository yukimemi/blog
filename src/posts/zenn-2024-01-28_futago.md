---
title: Gemini API を利用した Vim Plugin
date: 2024-01-28
draft: false
tags:
  - vim
  - denops
  - neovim
  - gemini
  - ai
layout: layouts/post.vto
type: post
zenn_type: tech
description: "Google Gemini APIを利用して、Vim上でAIとチャットができるプラグイン「futago.vim」を作成しました。会話履歴の保存や、ずんだもんキャラの設定例も紹介しています。"
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/futago) にも投稿しています。

Google Gemini の API が出ており、今は無料で使える！ということで、[denops.vim](https://github.com/vim-denops/denops.vim) を利用したプラグインを作成してみました。

https://github.com/yukimemi/futago.vim

こんな感じで、チャットできるプラグインです。

![futago](https://github.com/yukimemi/futago.vim/assets/6442108/29e371e3-c16e-4b94-8a0c-67a37e26f7b5)

## 使い方

1. Gemini API の key を取得

以下の URL から取得できます。

[Get API key](https://ai.google.dev/)

2. 環境変数へ設定

環境変数 `GEMINI_API_KEY` へ、取得した API key を設定してください。

3. `g:denops#server#deno_args` へ `--unstable-kv` を追加

チャット履歴を保存するために、 [Deno KV](https://deno.com/kv) を使用しています。
そのため、 `g:denops#server#deno_args` へ `--unstable-kv` を追加してください。

```vim
let g:denops#server#deno_args = ['-q', '--no-lock', '--unstable-kv', '-A']
```

4. プラグインインストール

お好きなプラグインマネージャーでプラグインをインストールしてください。
もちろん、 [denops.vim](https://github.com/vim-denops/denops.vim) も必須です。

5. `futago#start_chat()` の呼び出し

```vim
call futago#start_chat()
```

デフォルトだと新規タブでチャット画面が開きます。

```markdown
You: 2024-01-28T16-43-48.988
-------------

```

と出るので、 `-------------` の下になんか打ち込んでから保存すると、回答が返ってきます。

## 履歴からの継続チャット

[Deno KV](https://deno.com/kv) を利用して会話履歴を保存しているので、過去チャットから継続して会話することもできます。
過去チャットからの継続では初回の API 呼び出しで会話履歴を合わせて投げるので、あんま会話履歴が長いのだとダメになるかもです。

1. `FutagoHistory` コマンド呼び出し

履歴からの継続チャットを行うには、会話履歴を QuickFix に表示する、 `FutagoHistory` コマンドを呼び出します。

QuickFix にこれまでの会話履歴が出るので、開くことで継続して会話することができます。
一番最後の `-------------` 配下の行以降に書き込みをしてください。
特にチェックとかはしていないので変な所に書き込まれたりするとおかしくなります。

## カスタマイズ

`futago#start_chat()` には、辞書でいくつか引数を与えることができます。
例えばこんな感じです。

```vim
nnoremap <Leader>fc <Cmd>call futago#start_chat({
  \ "opener": "vsplit",
  \ "history": [
  \   {"role": "user", "parts": [{ "text": "僕の名前は yukimemi" }]},
  \   {"role": "model", "parts": [{ "text": "了解！覚えておくね" }]},
  \ ],
  \ "humanPrompt": "yukimemi"
  \ })<cr>
```

![futago_friendly](https://github.com/yukimemi/futago.vim/assets/6442108/fda94576-6885-4503-aec9-0f69b3b60d5d)

開き方を `vsplit` に変え、自分のプロンプト が `yukimemi` になって、 Gemini もフレンドリーに返してくれるようになります。

Gemini API では、 GPT みたいなシステムプロンプトがないようで、会話履歴、という形で指示を出すことはできるみたいです。

また、 Gemini API には、 [SafetySetting](https://ai.google.dev/api/generate-content?#safetysetting) という設定があり、
デフォルトだと安全性チェックが働き、閾値を超えた場合は動作がブロックされます。

一応、設定で変更できるようにしてありますが、すべての閾値を下げてブロックなし、とした場合でもブロックされるものはブロックされちゃうようです。

こんな感じで設定できます。

```vim
let g:futago_safety_settings = [
  \ { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
  \ { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"  },
  \ { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH" },
  \ { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
  \ ]
```

設定できる `category` と `threshold` はそれぞれ以下を参照ください。

- [HarmCategory](https://ai.google.dev/api/generate-content?#harmcategory)
- [HarmBlockThreshold](https://ai.google.dev/api/generate-content?#harmblockthreshold)


## ずんだもんとプログラミング！

会話履歴で指示出しはできるということなので、[こちら](https://zenn.dev/niwatoro/articles/180f6185c382bb#6.-%E5%87%BA%E5%8A%9B%E5%BD%A2%E5%BC%8F%E3%81%AE%E6%8C%87%E5%AE%9A) のプロンプトを参考に初期会話履歴として与えることで、ずんだもんとしてキャラ付けもできました。

https://github.com/yukimemi/dotfiles/blob/008541aa7e3c783d9c2e5357166435ece4774e05/.config/nvim/denops/config/plugins/ai.ts#L107-L219

※設定が TypeScript なのは [こちらの記事](https://zenn.dev/yukimemi/articles/2023-06-09-dvpm) 参照

これで、ずんだもんと楽しくプログラミングすることができます！！

試しにフィボナッチ数列の書き方を聞いてみましょう。

![futago_zundamon](https://github.com/yukimemi/futago.vim/assets/6442108/17b15c94-ce7c-4db0-9832-1bbb22ffee62)

・・・＼(^o^)／


