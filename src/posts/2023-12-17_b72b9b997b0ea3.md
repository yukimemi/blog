---
title: Hyper-V 環境構築
date: 2023-12-17T09:57:25.633Z
draft: false
tags:
  - hyper-v
  - powershell
layout: layouts/post.vto
type: post
zenn_type: tech
description: "MINISFORUM UM790Proを使ってHyper-V環境を構築した手順のメモです。PowerShellを使ったネットワーク設定（内部スイッチ、NAT）やVM作成の自動化について解説しています。"
---

この記事は [Zenn](https://zenn.dev/yukimemi/articles/b72b9b997b0ea3) にも投稿しています。

[MINISFORUM UM790Pro (64GB + 1T)](https://amzn.to/3Rr2ZBh) を購入したので、Hyper-V 環境を構築することにしました。

Hyper-V のネットワーク環境構築は初めてでよくわからなかったので、自分の忘備録としても記載します。
また、せっかくなら何度も簡単にスクラップアンドビルドできるようにできる限りコマンドで実行する方針としました。

## Hyper-V Network 構成

まずネットワーク環境を構成します。

![hyper-v_network](/static/images/hyper-v_network.png)

`external` (192.168.1.0/24) となっているのが家のネットワークになります。
通常の一般家庭でよくある、 `192.168.1.1` の IP を持つルーターがあってそこにいっぱいデバイスが接続されています。
`host` が購入した `UM790Pro` です。 IP として固定で `192.168.1.3` を割り当てました。この IP はなんでもいいはず。
Hyper-V 上のネットワークは、 `192.168.10.0/24` の内部ネットワークを作成して、インターネットへ接続するときはホストに作成する仮想スイッチ `192.168.10.254` 経由で NAT された `192.168.1.3` (host の物理NIC) からぬけていく経路となります。
この図のネットワーク環境作成と、 `guest1` の 仮想マシンの設定までを記載します。

## Hyper-V 有効化

以下コマンドで Hyper-V 機能を有効化します。
OS 再起動が求められるので再起動します。

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

## 内部スイッチ作成

以下コマンドで内部スイッチを作成します。

```powershell
New-VMSwitch -Name "vInternal" -SwitchType Internal
```

内部スイッチへ IP の設定をします。
このスイッチが仮想マシン内部ネットワークのゲートウェイとなります。

```powershell
$ifIndex = Get-NetAdapter -Name "vEthernet (vInternal)" | Select-Object -ExpandProperty ifIndex
New-NetIPAddress -InterfaceIndex $ifIndex -IPAddress "192.168.10.254" -PrefixLength 24
```

※ New-NetIPAddress で間違えた場合は、再実行すると IP アドレスが追加されるため、一度 Remove-NetIPAddress してから実行する必要があります。

例)
```powershell
Remove-NetIPAddress -InterfaceIndex $ifIndex
```

## NAT 作成

以下コマンドで NAT を作成します。

```powershell
New-NetNat -Name "NAT" -InternalIPInterfaceAddressPrefix "192.168.10.0/24"
```

これでネットワーク環境は構築完了です。
コマンドでやってみると一瞬で簡単です。

## 仮想マシン作成

今回、検証なので、評価用ISOを使って仮想マシンを作成します。
Windows Server 2022 ISO を以下からダウンロードします。

[Windows Server 2022 | Microsoft Evaluation Center](https://www.microsoft.com/ja-jp/evalcenter/download-windows-server-2022)

適当なパスに格納します。(自分は `C:\iso` へ格納しています)

VM 作成用の PowerShell スクリプトを作成したので、以下を clone しておきます。

https://github.com/yukimemi/hyper-v

`sample` ディレクトリ内の `new_vm.json` を参考に、作成する VM の設定を記載した `json` ファイルを作成します。

https://github.com/yukimemi/hyper-v/blob/eefc8d504943ea134e0141da0889bb64eb383989/sample/new_vm.json#L1-L25

以下コマンドで、仮想マシンを作成します。

```powershell
new_vm.cmd <json file path>
```

Hyper-V マネージャーを立ち上げると、VM が作成されているはず。
指定した iso がマウントされて、起動順序が1番目になっているので、そのまま起動して OS インストールします。


## ゲスト OS ネットワーク 設定

OS インストールが終わったら、 ゲスト OS で以下を実施します。

以下コマンドで、IP アドレスを設定します。

```powershell
$ifIndex = Get-NetAdapter | Select-Object -ExpandProperty ifIndex
New-NetIPAddress -InterfaceIndex $ifIndex -IPAddress "192.168.10.1" -PrefixLength 24 -DefaultGateway "192.168.10.254"
```

以下コマンドで DNS サーバーを設定します。(ここでは Google の DNS を使用。内部ネットワークに AD とか立てるならそっちを参照)

```powershell
Set-DnsClientServerAddress -InterfaceIndex $ifIndex -ServerAddresses @("8.8.8.8", "8.8.4.4")
```

以上で、仮想マシンから external 経由でインターネットアクセスを行うことができるようになります。

- - -

## 参考

- [NAT ネットワークの設定 | Microsoft Learn](https://learn.microsoft.com/ja-jp/virtualization/hyper-v-on-windows/user-guide/setup-nat-network#connect-a-virtual-machine)

- [仮想ネットワークを作成します | Microsoft Learn](https://learn.microsoft.com/ja-jp/virtualization/hyper-v-on-windows/quick-start/connect-to-network)


