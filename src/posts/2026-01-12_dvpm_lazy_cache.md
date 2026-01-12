---
title: dvpm (Denops Vim Plugin Manager) をもっと便利に (キャッシュと遅延ロード)
date: 2026-01-12 09:08:36
layout: layouts/post.vto
tags: ["neovim", "vim", "dvpm", "denops", "deno"]
description: "自作の plugin manager である dvpm に、キャッシュ機能と遅延ロード機能を追加して爆速かつ便利にした話"
type: post
zenn_type: tech
---

[以前の記事](https://zenn.dev/yukimemi/articles/2023-06-09-dvpm) で自作のプラグインマネージャー `dvpm` を紹介してから、はや2年半以上が経過しました。
自分でも使い続けながら、少しずつ改良を重ねてきたのですが、特筆すべき大きな進化が2つあるので紹介したいと思います。

それが、**キャッシュ機能** と **遅延ロード機能** です。

<!-- more -->

## 起動直後からプラグインを使いたい！ (キャッシュ機能)

前回の記事で、 `dvpm` の特徴として「どれだけプラグインを入れても起動速度が劣化しない」という点を挙げました。
しかし、これには「起動直後はプラグインがまだ読み込まれておらず、バックグラウンドで denops が立ち上がってから順次読み込まれる」というトレードオフがありました。

「爆速で起動してほしいけど、起動した直後から Telescope などのプラグインをすぐに使いたい……」

そんなわがままを叶えるのが **キャッシュ機能** です。

### 仕組み

`dvpm` のキャッシュ機能は、各プラグインの `runtimepath` への追加処理や、 `before` / `after` で指定した Vim script / Lua の設定を、一つの `.vim` ファイルに書き出します。

次回以降の Vim / Neovim 起動時に、このキャッシュファイルを `source` するように設定しておけば、 **denops の起動を待たずして、通常のプラグインマネージャーと同じように起動時からプラグインが有効になります。**

### 設定方法

`Dvpm.begin` でキャッシュファイルの出力先を指定し、各プラグインで `cache.enabled: true` を設定するだけです。

```typescript
export async function main(denops: Denops): Promise<void> {
  const base_path = (await fn.has(denops, "nvim")) ? "~/.cache/nvim/dvpm" : "~/.cache/vim/dvpm";
  const base = (await fn.expand(denops, base_path)) as string;

  // キャッシュファイルの出力先を指定
  const cache_path = (await fn.has(denops, "nvim"))
    ? "~/.config/nvim/plugin/dvpm_plugin_cache.vim"
    : "~/.config/vim/plugin/dvpm_plugin_cache.vim";
  const cache = (await fn.expand(denops, cache_path)) as string;

  const dvpm = await Dvpm.begin(denops, { base, cache });

  // キャッシュを有効にする
  await dvpm.add({
    url: "tani/vim-artemis",
    cache: { enabled: true },
  });

  // 起動時にすぐ表示されてほしいダッシュボードなどはキャッシュに最適
  await dvpm.add({
    url: "goolord/alpha-nvim",
    enabled: async ({ denops }) => await fn.has(denops, "nvim"),
    cache: {
      after: `
        lua << EOB
          require("alpha").setup(require("alpha.themes.startify").config)
        EOB
      `,
    },
  });

  await dvpm.end();
}
```

:::message
**注意: キャッシュファイルのパスについて**

`Dvpm.begin` に指定する `cache` のパスは、通常 `plugin/` ディレクトリの下など、 **Vim / Neovim の `runtimepath` にデフォルトで含まれている場所** を指定してください。
もし `runtimepath` 外の場所を指定した場合は、そのファイルを `source` するか、ディレクトリを `runtimepath` に追加する設定を自前で書く必要があります。
:::

このように設定しておくと、 `dvpm` がキャッシュファイルを自動生成してくれます。
ダッシュボードのような「起動した瞬間に見えていてほしい」プラグインでも、ストレスなく利用できるようになります。

### キャッシュの詳細オプション

キャッシュ機能にも、通常ロードと同様に、以下の設定オプションが用意されています。

- `before`: プラグインが `runtimepath` に追加される **前** に実行する Vim script / Lua を記述します。
- `after`: プラグインが `runtimepath` に追加された **後** に実行する Vim script / Lua を記述します。
- `beforeFile`: `before` と同様ですが、文字列ではなく外部ファイル（ `.vim` や `.lua` ）のパスを指定して読み込ませます。
- `afterFile`: `after` と同様に、外部ファイルのパスを指定します。

**`before`, `after`, `beforeFile`, `afterFile` のいずれかが設定されている場合、 `cache.enabled: true` は省略できます** 

## 必要な時だけ読み込みたい！ (遅延ロード機能)

最近のプラグインマネージャー（ `lazy.nvim` など）では当たり前となっている **遅延ロード (Lazy Load)** にも対応しました。

「特定のファイルタイプを開いた時だけ」「特定のコマンドを叩いた時だけ」といった条件でプラグインをロードできます。

### 設定例

`dvpm.add` の `lazy` オプションで指定します。

```typescript
  // コマンド実行時にロード
  await dvpm.add({
    url: "tweekmonster/startuptime.vim",
    lazy: { cmd: "StartupTime" },
  });

  // 特定のイベント発生時にロード (例: インサートモードに入った時)
  await dvpm.add({
    url: "cohama/lexima.vim",
    lazy: { event: "InsertEnter" },
  });

  // ファイルタイプに応じてロード
  await dvpm.add({
    url: "OXY2DEV/markview.nvim",
    lazy: { ft: "markdown" },
    dependencies: ["nvim-treesitter/nvim-treesitter"],
  });

  // キー入力でロード
  await dvpm.add({
    url: "mbbill/undotree",
    lazy: {
      keys: {
        lhs: "<leader>u",
        rhs: "<cmd>UndotreeToggle<cr>",
        mode: "n",
        desc: "Undo Tree",
      },
    },
  });

  // ライブラリとそれを使用するプラグインの遅延ロード
  await dvpm.add({
    url: "kana/vim-textobj-user",
    lazy: { enabled: true },
  });
  await dvpm.add({
    url: "kana/vim-textobj-entire",
    dependencies: ["kana/vim-textobj-user"],
    lazy: {
      keys: [
        { lhs: "ie", mode: ["x", "o"] },
        { lhs: "ae", mode: ["x", "o"] },
      ],
    },
  });
```

`keys` の指定では、プロキシマッピングを自動で作成し、キーが押された瞬間にプラグインをロードして、本来の機能を実行するようになっています。 `mode` や `desc` を指定することで、 `which-key.nvim` などのプラグインとも相性良く設定できます。

### 遅延ロードの詳細オプション

遅延ロード設定は配列指定など、いくつかのパターンで設定できます。

- **配列での指定**: `cmd`, `event`, `ft`, `keys` はいずれも配列を受け取れます。複数のコマンドやファイルタイプをきっかけにロードしたい場合に便利です。
- **`keys` の `lhs` のみ指定**: `rhs` を省略して `lhs` だけを指定することも可能です。この場合、ロード後に `dvpm` が作成した暫定的なマッピングを解除（unmap）し、プラグイン側が本来定義しているマッピングが有効になるように振る舞います。
- **依存関係の自動ロード**: `lazy` 設定されたプラグインが読み込まれる際、 `dependencies` に指定されたプラグインも（それらが `lazy`であっても）自動的にロードされます。

### ライフサイクルと User イベント

`dvpm` はプラグインの登録からロードまでの各工程で、詳細に制御するためのフックと `User` イベントを提供しています。
フックの実行順序は以下の通りです。

1. **`add` / `addFile`**: `Dvpm.end()` 実行時に常に実行（ロードの有無に関わらず実行）。
2. **`before` / `beforeFile`**: `runtimepath` に追加される直前に実行（遅延ロード時はロード発生時）。
3. **`after` / `afterFile`**: `runtimepath` に追加され、 `plugin/*.vim` や `plugin/*.lua` がソースされた直後に実行。

また、これらに合わせて詳細な `User` イベントも発火します。

#### システムライフサイクルイベント
- `DvpmBeginPre` / `DvpmBeginPost`: `Dvpm.begin()` の前後。
- `DvpmEndPre` / `DvpmEndPost`: `Dvpm.end()` の前後。
- `DvpmInstallPre` / `DvpmInstallPost`: プラグイン全体のインストール前後。
- `DvpmUpdatePre` / `DvpmUpdatePost`: プラグイン全体のアップデート前後。
- `DvpmCacheUpdated`: キャッシュファイルが更新された時。

#### プラグイン個別イベント
- `DvpmPluginLoadPre:{pluginName}` / `DvpmPluginLoadPost:{pluginName}`: 個別ロードの前後。
- `DvpmPluginInstallPre:{pluginName}` / `DvpmPluginInstallPost:{pluginName}`: 個別インストールの前後。
- `DvpmPluginUpdatePre:{pluginName}` / `DvpmPluginUpdatePost:{pluginName}`: 個別アップデートの前後。

※ `{pluginName}` は `dvpm` で管理されているプラグイン名です。通常はリポジトリ URL の末尾（例: `cohama/lexima.vim` なら `lexima.vim`）になりますが、 `dvpm.add` の際に `name` プロパティで任意の名前を指定することも可能です。

このように、Vim script / Lua 側からも `autocmd User DvpmPluginLoadPost:lexima.vim ...` といった形で、特定のプラグインがロードされたタイミングをフックすることができます。
また、ワイルドカードを使って、各プラグインがロードされるたびに共通の処理を一括でフックすることも可能です。

```typescript
// 各プラグインがロードされるたびに、そのプラグイン名をログに出す例
await autocmd.define(
  denops,
  "User",
  "DvpmPluginLoadPost:*",
  `echom "Loaded plugin: " . substitute(expand("<amatch>"), "^DvpmPluginLoadPost:", "", "")`,
);
```

他にも `DvpmBeginPre/Post`, `DvpmEndPre/Post`, `DvpmCacheUpdated` といったシステム全体のライフサイクルに合わせたイベントも用意されています。

:::message
**注意: フック登録のタイミング**

`dvpm` は `denops.vim` 上で動作するため、各種フック（コマンド、イベント、ファイルタイプ、キー）が `denops` 側で登録完了するまでは、たとえ条件を満たしていてもプラグインはロードされません。起動直後の極めて早いタイミングで発生するイベントなどには注意が必要です。
:::

## まとめ

キャッシュ機能と遅延ロード機能が加わったことで、 `dvpm` は「TypeScript で Vim / Neovim の設定が書ける」という変態的なメリットを維持したまま、現代的なプラグインマネージャーとしての利便性と、圧倒的な起動速度の両立を手に入れました。

「やっぱり設定は型安全に TypeScript で書きたい！」という方は、ぜひ試してみてください。

[yukimemi/dvpm: dvpm - Denops Vim/Neovim Plugin Manager](https://github.com/yukimemi/dvpm)


