# スタラジ (Star Radio) - Audio Feed

AI自動生成ポッドキャスト「スタラジ」の音声配信サイト。

## サイト

https://almlog.github.io/starradio-feed/

## 概要

- Raspberry Pi上で毎朝自動生成されるポッドキャスト音声をGitHub Pagesで配信
- エピソード一覧 + ブラウザ内音声プレーヤー
- Podcast RSS (feed.xml) 対応

## 仕組み

```
Pi (cron 05:30) → 台本生成 → TTS音声生成 → git push → GitHub Pages 自動deploy
```

## 技術スタック

- 静的HTML/CSS/JS（フレームワーク不使用）
- GitHub Pages + GitHub Actions
- HTML5 `<audio>` によるストリーミング再生
- Podcast RSS 2.0 + iTunes namespace

## ファイル構成

```
public/
  index.html       # プレーヤーUI
  style.css        # ダークテーマ
  app.js           # エピソード読込+描画
  episodes.json    # エピソードメタデータ
  feed.xml         # Podcast RSS
  audio/           # mp3ファイル (自動管理、90日保持)
```

## RSS購読

```
https://almlog.github.io/starradio-feed/feed.xml
```

## 関連リポジトリ

- [auto-podcast-trader](https://github.com/almlog/auto-podcast-trader) — 生成パイプライン本体
