# スタラジ (Star Radio) - Audio Feed

AI自動生成ポッドキャスト「スタラジ」の音声配信サイト。

## サイト

https://almlog.github.io/starradio-feed/

## 概要

- Raspberry Pi上で毎朝自動生成されるポッドキャスト音声をGitHub Pagesで配信
- ミニマル・モダンデザイン（Apple HIG準拠のダークテーマ）
- エピソード一覧 + カレンダービューの切り替え表示
- 折りたたみ式エピソードカード（最新は展開、過去分は折りたたみ）
- キャストチップのホバーでパーソナリティプロフィール表示
- セグメントクリックで該当箇所にシーク再生
- Podcast RSS (feed.xml) 対応

## 仕組み

```
Pi (cron 05:30) → 台本生成 → TTS音声生成 → git push → GitHub Pages 自動deploy
```

`characters.json` は [auto-podcast-trader](https://github.com/almlog/auto-podcast-trader) のキャラクタースペックから生成。キャラ追加・変更時は手動更新が必要。

## 技術スタック

- 静的HTML/CSS/JS（フレームワーク不使用、ビルドステップなし）
- GitHub Pages + GitHub Actions
- HTML5 `<audio>` によるストリーミング再生
- Podcast RSS 2.0 + iTunes namespace
- CSS Custom Properties によるデザイントークン管理

## ファイル構成

```
public/
  index.html         # プレーヤーUI（タブ切り替え対応）
  style.css          # ミニマル・モダン ダークテーマ
  app.js             # エピソード描画 + カレンダー + ツールチップ
  characters.json    # パーソナリティプロフィール（自動同期）
  episodes.json      # エピソードメタデータ（自動更新）
  feed.xml           # Podcast RSS（自動更新）
  audio/             # mp3ファイル（自動管理、90日保持）
  scripts/           # 台本.md（自動管理、90日保持）
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| タブ切り替え | 一覧 / カレンダーの表示切り替え |
| カレンダー | 月ナビ付き。配信日にドット表示、クリックで該当エピソードへ |
| 折りたたみカード | ヘッダークリックで展開/折りたたみ |
| キャストツールチップ | ホバーで名前・役割・カテゴリ・プロフィール表示 |
| セグメントシーク | セグメント名クリックで該当秒にジャンプ再生 |
| キャラプロフィール | characters.json に定義。auto-podcast-trader のスペックから生成 |

## RSS購読

```
https://almlog.github.io/starradio-feed/feed.xml
```

## 関連リポジトリ

- [auto-podcast-trader](https://github.com/almlog/auto-podcast-trader) — 生成パイプライン本体
