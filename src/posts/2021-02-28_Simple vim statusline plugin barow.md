---
title: Simple vim statusline plugin barow
date: 2021-02-28T10:50:33+09:00
draft: false
tags:
  - vim
  - plugin
  - statusline
layout: layouts/post.vto
type: post
---


Vim の simple な statusline plugin があったので使用してみた。

[doums/barow: A minimalist statusline for n/vim](https://github.com/doums/barow)
![barow](https://github.com/doums/barow/blob/master/img/barow.png?raw=true)

<!-- more -->

僕は最近結局 [dein.vim](https://github.com/Shougo/dein.vim) を使用しているので以下のような設定。
[barow](https://github.com/doums/barow) に付随する、 [lsp](https://github.com/doums/barowLSP) と [git](https://github.com/doums/barowGit) の plugin も追加している。

設定内容はそれぞれの README にあったものに追加して、 `bomb` , `filetype` , `fileencoding` , `fileformat` を表示するようにしてる。

- dein.toml

```toml
[[plugins]]
repo = "doums/barow"
depends = ["barowLSP", "barowGit"]
on_event = ['CursorHold', 'FocusLost']
hook_add = '''
source $VIM_PATH/rc/barow.vim
'''

[[plugins]]
repo = "doums/barowLSP"
lazy = 1
[[plugins]]
repo = "doums/barowGit"
lazy = 1
```

- $VIM_PATH/rc/barow.vim

```vim
function! MyBarowBomb() abort
  return &bomb ? ' bomb ' : ''
endfunction
function! MyBarowFileType() abort
  return ' ' . &filetype . ' '
endfunction
function! MyBarowFencFF() abort
  return ' [' . &fileencoding . ' / ' . &fileformat . '] '
endfunction

let g:barow = {
      \  'modes': {
      \    'normal'  : [' ', 'BarowNormal'],
      \    'insert'  : ['i', 'BarowInsert'],
      \    'replace' : ['r', 'BarowReplace'],
      \    'visual'  : ['v', 'BarowVisual'],
      \    'v-line'  : ['l', 'BarowVisual'],
      \    'v-block' : ['b', 'BarowVisual'],
      \    'select'  : ['s', 'BarowVisual'],
      \    'command' : ['c', 'BarowCommand'],
      \    'shell-ex': ['!', 'BarowCommand'],
      \    'terminal': ['t', 'BarowTerminal'],
      \    'prompt'  : ['p', 'BarowNormal'],
      \    'inactive': [' ', 'BarowModeNC']
      \  },
      \  'statusline': ['Barow', 'BarowNC'],
      \  'tabline': ['BarowTab', 'BarowTabSel', 'BarowTabFill'],
      \  'buf_name': {
      \    'empty': '',
      \    'hi'   : ['BarowBufName', 'BarowBufNameNC']
      \  },
      \  'read_only': {
      \    'value': 'ro',
      \    'hi': ['BarowRO', 'BarowRONC']
      \  },
      \  'buf_changed': {
      \    'value': '*',
      \    'hi': ['BarowChange', 'BarowChangeNC']
      \  },
      \  'tab_changed': {
      \    'value': '*',
      \    'hi': ['BarowTChange', 'BarowTChangeNC']
      \  },
      \  'line_percent': {
      \    'hi': ['BarowLPercent', 'BarowLPercentNC']
      \  },
      \  'row_col': {
      \    'hi': ['BarowRowCol', 'BarowRowColNC']
      \  },
      \  'modules': [
      \    [ 'barowGit#branch', 'BarowHint' ],
      \    [ 'barowLSP#error', 'BarowError' ],
      \    [ 'barowLSP#warning', 'BarowWarning' ],
      \    [ 'barowLSP#info', 'BarowInfo' ],
      \    [ 'barowLSP#hint', 'BarowHint' ],
      \    [ 'barowLSP#coc_status', 'StatusLine' ],
      \    [ 'barowLSP#ale_status', 'StatusLine' ],
      \    [ 'MyBarowFileType', 'BarowInfo' ],
      \    [ 'MyBarowFencFF', 'BarowInfo' ],
      \    [ 'MyBarowBomb', 'BarowInfo' ],
      \  ]
      \ }
```

![barow](/static/images/2021-02-28_barow.png)

うん、シンプルだし、ちょっと気分転換にはいいかも！

---

### 参考

- [doums/barow: A minimalist statusline for n/vim](https://github.com/doums/barow)
- [doums/barowLSP: n/vim plugin to display LSP info in barow statusline](https://github.com/doums/barowLSP)
- [doums/barowGit: A module to display the current git branch in barow statusline](https://github.com/doums/barowGit)
