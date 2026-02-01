---
title: OpenClaw を Discord で動かす
date: 2026-02-01 17:50:00
layout: layouts/post.vto
tags: ["OpenClaw", "Discord", "AI", "dotfiles", "chezmoi"]
description: "OpenClaw を Discord で動かすためのセットアップ手順まとめ。"
type: post
---

[OpenClaw](https://openclaw.ai/) を Discord で動かすためのセットアップを行いました。
設定ファイルや AI の記憶（ワークスペース）を安全に管理しつつ、快適な AI エージェント環境を構築する手順をまとめます。

## OpenClaw とは

OpenClaw は、自律的な AI エージェントをローカルで動かし、WhatsApp や Discord などのメッセージングアプリと連携させることができるツールです。
シェルコマンドの実行やファイル操作などのスキルを持たせることができ、AI が「思考」するだけでなく「実行」まで担ってくれます。

## セットアップ手順

### 1. Discord Bot の作成

まずは Discord 側で Bot アカウントを作成します。

1. [Discord Developer Portal](https://discord.com/developers/applications) で `New Application` を作成。
2. `Bot` セクションでトークンを取得。
3. `Privileged Gateway Intents` ですべての項目（特に `Message Content Intent`）を ON にして保存。
4. `OAuth2` -> `URL Generator` で `bot` スコープと `Administrator` 権限を選択し、生成された URL をブラウザに貼り付け、自分のサーバーに Bot を招待。

**注意:** Intents を変更した後は、一度サーバーから Bot をキックして招待し直さないと権限変更が反映されない場合があるので注意が必要です。

### 2. OpenClaw の初期化

```bash
mkdir ~/.openclaw
cd ~/.openclaw
npx openclaw onboard
```

`onboard` コマンドを実行すると、対話形式でセットアップが始まります。
主な質問と設定内容は以下の通りです。

1.  **Risk Acknowledgement**: リスクについての確認。`y` で承諾。
2.  **Onboarding mode**: `QuickStart` を選択。
3.  **Model/auth provider**: 使用する AI モデルを選択。Google (Gemini) や OpenAI などから選べます。
    *   API キーの入力や、OAuth によるブラウザ認証（`Google Antigravity OAuth` など）を行います。
4.  **Channel Setup**: ここで `Discord` を選択。
    *   取得した **Discord Bot Token** を入力します。
5.  **Skills/Hooks**: 依存関係（スキル）のインストールに使用するパッケージマネージャ（Bunなど）の選択や、自動化のための Hooks（`session-memory`, `command-logger` など）を有効にするかを選択します。

設定が完了すると Gateway が起動し、Discord Bot がオンラインになります。

### 3. systemd による自動起動

セットアップの最後で、OpenClaw が「gateway サービスを systemd としてインストールし、有効化するか？」と聞いてくるので、`Yes` と答えるだけで自動的にバックグラウンドサービスとして常駐します。

## AI の記憶と設定ファイルについて

OpenClaw の最大の特徴は、AI の記憶や設定がすべてローカルの Markdown ファイルとして管理されている点です。
`~/.openclaw/workspace` ディレクトリには以下のようなファイルが生成されます。

*   **`IDENTITY.md`**: AI 自身のアイデンティティ（名前、性格、口調など）。ここを編集すると AI のキャラ付けを変更できます。
*   **`USER.md`**: ユーザー（自分）に関する情報。名前や好みなどが記録されます。
*   **`MEMORY.md`**: 長期記憶。重要な事実や文脈がここに蓄積されます。
*   **`SOUL.md`**: AI の行動原理や「魂」にあたる部分。
    *   このファイルは非常にユニークで、対話を通じて「実行前には必ず確認してほしい」とか「定期的にリポジトリを同期して」といったルールが追記されていきます。`git log` で履歴を見ると、AI が指導を受けて成長していく様子が分かります。
*   **`AGENTS.md`**, **`TOOLS.md`**: エージェントの構成や使用可能なツールの定義。

Discord で会話しながら「私の名前は yukimemi だよ」と教えたり、「〜については覚えておいて」と頼んだりすると、AI が自律的にこれらのファイルを更新します。
記憶がテキストファイルとして可視化され、さらに Git でバージョン管理できるため、「いつ何を覚えたか」が履歴として残るのが非常に面白いです。

## 遭遇したトラブルと解決策

### `Failed to resolve Discord application id` エラー
Discord Bot のトークンからアプリケーション ID が正しく解決できない場合に発生します。
これは設定ファイル (`openclaw.json`) の不整合が原因でしたが、`npx openclaw doctor --fix` を実行することで、設定ファイルを自動的に修復して解決できました。

### 記憶（workspace）の管理
前述の通り、OpenClaw のワークスペース（`~/.openclaw/workspace`）はそれ自体が Git リポジトリとして管理されています。
そのため、自分の `dotfiles` リポジトリなどでまとめて管理しようとするとサブモジュール扱いになってしまい、中身（AI の記憶）が保存されません。

今回はワークスペースを `dotfiles` の管理対象外（`.gitignore`）とし、**エージェント自身に自分の記憶を Git 管理させる** という運用スタイルにしました。
AI に「記憶をコミットして GitHub にプッシュしておいて」と頼むと、自分で `git commit` して、GitHub CLI (`gh`) を使ってリポジトリ作成からプッシュまで完遂してくれました。これは感動的です。

## まとめ

これで、Discord を通じていつでも自律エージェントと対話できる環境が整いました。
自分だけの AI アシスタント、これから育てていくのが楽しみです。
