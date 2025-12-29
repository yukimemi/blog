---
title: Deno テスト環境構築 (Vim)
date: 2021-04-25
draft: false
tags:
  - vim
  - neovim
  - deno
layout: layouts/post.vto
type: post
zenn_type: idea
description: "VimでDenoのテスト環境を構築する方法です。`vim-test`と`neoterm`を組み合わせて、カーソル位置のテストを実行する設定などを紹介しています。"
---


[Deno](https://deno.land/) のテストをいい感じに `Vim` で実行できるように環境構築。

<!-- more -->

## vim-test の導入

テスト実行には、以下のプラグインが有名そうだったので導入。

https://github.com/vim-test/vim-test

インストールは [dein.vim](https://github.com/Shougo/dein.vim) だとこんな感じ。

```toml
[[plugins]]
repo = 'vim-test/vim-test'
depends = ['neoterm']
on_cmd = ['TestNearest', 'TestFile', 'TestSuite', 'TestLast', 'TestVisit']
hook_add = '''
nnoremap <silent> <space>tn <cmd>TestNearest<cr>
nnoremap <silent> <space>tf <cmd>TestFile<cr>
nnoremap <silent> <space>ts <cmd>TestSuite<cr>
nnoremap <silent> <space>tl <cmd>TestLast<cr>
nnoremap <silent> <space>tg <cmd>TestVisit<cr>

let test#strategy = {
	\ 'nearest': 'neoterm',
	\ 'file'   : 'neoterm',
	\ 'suite'  : 'neoterm',
	\ }

let test#javascript#denotest#options = {
    \ 'all': '--no-check --unstable -A'
    \ }
'''

[[plugins]]
repo = 'kassio/neoterm'
on_cmd = ['Tnew']
hook_add = '''
let g:neoterm_autoinsert = 1
let g:neoterm_autoscroll = 1
let g:neoterm_default_mod = 'botright'
let g:neoterm_size = 10
'''
```

[vim-test](https://github.com/vim-test/vim-test) だと、 `strategy` と呼ばれるものでテスト実行に何を使用するか選ぶことができる。
色々試した結果、 [kassio/neoterm](https://github.com/kassio/neoterm) が良さそうだったのでこれを使用中。
見え方とか変わるくらいやから正直これはなんでもいいと思う。
何が選べるかは [vim-test/vim-test: strategies](https://github.com/vim-test/vim-test#strategies) を参照。

## Deno test 構成

[Deno](https://deno.land/) のテストでは組み込みの `Deno.test` 関数があるのでそれが使用できる。
基本的に実装が `mod.ts` に記載してあるとすると、テストは `mod_test.ts` に記載するっぽい。
(後ろに `_test` をつける。)

かんたんに例を書くとこんな感じ。

- mod.ts

```typescript
export const getTrue = (): boolean => {
  return true;
};

export const add = (x: number, y: number): number => {
  return x + y;
};
```

- mod_test.ts

```typescript
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.95.0/testing/asserts.ts";
import { add, getTrue } from "./mod.ts";

Deno.test("getTrue test", () => {
  assert(getTrue());
});

Deno.test("add test", () => {
  const expected = 2;
  const actual = add(1, 1);
  assertEquals(actual, expected);
});
```

`mod_test.ts` を開いて、 `Deno.test("getTrue")` の付近にカーソルがある状態で `<space>tn` を押下すると、以下のように `getTrue` のみのテストが実行される。

![TestNearest](/static/images/2021-04-25_TestNearest.png)

`<space>tf` を押下すると、以下のように `mod_test.ts` のすべてのテストが実行される。

![TestFile](/static/images/2021-04-25_TestFile.png)

べんり。

---

#### 参考

- [Manual | Deno](https://deno.land/manual/testing)
- [vim-test/vim-test: Run your tests at the speed of thought](https://github.com/vim-test/vim-test)
- [kassio/neoterm: Wrapper of some vim/neovim's :terminal functions.](https://github.com/kassio/neoterm)
