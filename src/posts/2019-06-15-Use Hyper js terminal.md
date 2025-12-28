---
title: Use Hyper js terminal
date: 2019-06-15T10:45:00+09:00
draft: false
tags:
  - hyper
  - terminal
layout: layouts/post.vto
type: post
---


Electron を使用した Terminal である [Hyper™](https://hyper.is/) を使ってみた。

<!-- more -->

前も実は使ったことがあるんだけど、その時は vim 内で日本語がうまく入力できなかったり、動作が iTerm に比べてめちゃくちゃ遅かったりと、使えなかったため使わずに iTerm に戻ってしまっていた。
しかし、この度再度使ってみたところ、完全に iTerm を置き換えることができたので紹介。

自分の iTerm の使い方は、昔 Linux で Guake という Terminal を使っていたこともあって、 `F12` を押すとアクティブになって再度押下すると非アクティブになるっていう使い方だった。

Terminal の表示は全画面表示で、半透明。
同じような設定が、 [Hyper™](https://hyper.is/) でもできた。
こんな感じ。

![hyper](/static/images/hyper.png)


使用している plugin
-------------------

使っているプラグインは以下の5つ。

- [simonmeusel/hyperfull: Allows you to open hyperterm in fullscreen](https://github.com/simonmeusel/hyperfull)
- [jancborchardt/hyperminimal: Hyper terminal extension to remove window header](https://github.com/jancborchardt/hyperminimal)
- [CWSpear/hyperterm-visor: Open your Hyper terminal from anywhere with a global hotkey.](https://github.com/cwspear/hyperterm-visor)
- [lucleray/hyper-opacity: Set the opacity of your Hyper terminal (Windows and MacOS)](https://github.com/lucleray/hyper-opacity)
- [equinusocio/hyper-material-theme: The Hyper official porting of the original Material Theme.](https://github.com/equinusocio/hyper-material-theme)

[hyperfull](https://github.com/simonmeusel/hyperfull) でフルスクリーン表示。
[hyperminimal](https://github.com/jancborchardt/hyperminimal) で余計なタイトルバーなどを除去。 tmux を使用するのでタブなども不要。
[hyperterm-visor](https://github.com/cwspear/hyperterm-visor) で `F12` 押下でトグルできるように。
[hyper-opacity](https://github.com/lucleray/hyper-opacity) で半透明に。
[hyper-material-theme](https://github.com/equinusocio/hyper-material-theme) はテーマ。

それぞれの設定はこんな感じ。
[hyperterm-visor](https://github.com/cwspear/hyperterm-visor) と [hyper-opacity](https://github.com/lucleray/hyper-opacity) 以外は特に設定なし。


```js
module.exports = {
  config: {

    ... (略)

    // visor
    visor: {
      hotkey: "F12"
    },

    // opacity
    opacity: 0.9
  },

  plugins: [
    "hyperfull",
    "hyperminimal",
    "hyperterm-visor",
    "hyper-opacity",
    "hyper-material-theme"
  ],

  ... (略)
};

```

いい感じです！

## 参考
- - -
- [Hyper™](https://hyper.is/)
- [simonmeusel/hyperfull: Allows you to open hyperterm in fullscreen](https://github.com/simonmeusel/hyperfull)
- [jancborchardt/hyperminimal: Hyper terminal extension to remove window header](https://github.com/jancborchardt/hyperminimal)
- [CWSpear/hyperterm-visor: Open your Hyper terminal from anywhere with a global hotkey.](https://github.com/cwspear/hyperterm-visor)
- [lucleray/hyper-opacity: Set the opacity of your Hyper terminal (Windows and MacOS)](https://github.com/lucleray/hyper-opacity)
- [equinusocio/hyper-material-theme: The Hyper official porting of the original Material Theme.](https://github.com/equinusocio/hyper-material-theme)

