# Cinematic Globe v1.2 TOP組み込み・About Us土台 検証記録（2026-11-14）

範囲: プレビューのみ。commit・push・デプロイは未実施。

## 元資産
- HTML: `~/.gemini/users/user1/connectrip-globe-v1.2/connectrip_cinematic_globe_v1_2.html`（4.6MB、画像8点をbase64で埋め込み）
- 仕様書: `~/Downloads/Connectrip_Cinematic_Globe_Spec_v1.md`（コピー5件はすべて同一内容）

## 実装
- `src/website-v1/components/globe/`
  - `globeRenderer.ts`: v1.2 の WebGL シェーダー、カメラ、光、雲、大阪からのライン。遅延読み込みの別チャンク。
  - `CinematicGlobePhilosophy.tsx`: 文字、4カットの演出、一時停止、フォールバック、後片付け。
  - `CinematicGlobePhilosophy.module.css`: スタイル。
  - `PhilosophySection.tsx`: プレビューのときだけ描画する。
- `src/website-v1/content/philosophy.ts`: 文言と画像パス。権利は NOT_VERIFIED。
- `public/images/v1/globe/*.webp`: 6点、合計 約340KB。PC は 約320KB、スマホは 約280KB を使う。
- About:
  - `src/contracts/pages.ts`: AboutContent を5セクション構成にした。
  - `content/pages.ts`: getAboutViewModel
  - `views/PageViews.tsx`: AboutView

## 検証結果（ヘッドレス Chromium、WebGL は SwiftShader）
- 配置:
  - main の最後の要素で、直後が footer
  - 公開モードでは DOM に出ない
- 4カット:
  - PC 1440、PC 1920、スマホ 390、スマホ 360 で、cut 1→4 の順に進む
  - 逆にスクロールすると cut 1 に戻る
- 横スクロール: すべての幅で 0
- コンソールエラー: 0
- 遅延読み込み: ページの先頭では、描画エンジンも画像も読み込まない
- 画面外: 描画回数が増えない（0）
- 一時停止: 停止中の描画は 0回（3回×2つの画面幅で確認）。aria-pressed とボタン表記が切り替わる。
- WebGL 不可（getContext が null）: 静止画像が出て、文字・リンクは表示され、一時停止ボタンは隠れる
- 素材の読み込み失敗: 静止画像に切り替わり、reason=texture-error
- 動きを減らす設定:
  - 演出を止めた状態（still）で、sticky の長いスクロールはない（トラック = 1画面分）
  - 文字・リンクは最初から表示
- キーボード: cut 1 の位置でもリンクにフォーカスすると全文が表示され、Enter で /v1/about に移動する
- Discover Our Story → /v1/about（4つの画面幅すべて）
- About:
  - h1 は「About Us」
  - 5セクション（company-overview、philosophy、mission、vision、values）
  - 横スクロールは 0
- tsc、eslint、`bun run check:booking`、`npx next build`（公開モード）: OK
- 公開モード（next start、ポート3099で一時起動し、確認後に停止）:
  - / が 200 で、地球・理念・About へのリンクはない
  - /about は 404
  - 公開中の6ページ（private-guide、inquiry、company、cancel-policy、privacy、terms）は 200
  - sitemap は7件のまま

## 既知の注意点
- 公開ビルドの TOP 用 JS に、地球の制御部分（約5.5KB、gzip 後 約2.3KB）が未使用のまま含まれる。
  - DOM、画像、WebGL エンジンは含まれない。
  - 完全に外すには next.config.ts の resolveAlias が必要（未実施）。
- `public/images/v1/globe/` の画像は、デプロイすると URL を直接指定すれば取得できる。ほかのプレビュー画像も同じ扱い。
- 実機（iOS Safari、Android Chrome）とハードウェア GPU での描画品質・フレームレートは未検証。

---

# V1.3（2026-11-14）最終演出と世界への接続ライン

範囲: 地球セクション専用のファイルのみ（`components/globe/*`、`content/philosophy.ts`、`public/images/v1/globe/`）。commit・push・デプロイは未実施。

## 変更
- 背景:
  - 基本色を `--color-navy-dark`（#0d1f36）にした。OUR VALUE、SNS、Footer と同じ変数。
  - 中央だけ少し深い紺（navy-dark 80% + #030b17）にし、地球の周囲に navy-light の淡い光を置いた。
  - 黒いグラデーションと、前後のつなぎ用の帯は廃止した。
- 地球の大きさ:
  - PC: `min(88vw, 112vh, 1180px)`。1440×900 で 760px → 1008px（+33%）、1920×1080 で 760px → 1180px。
  - スマホ: `min(150vw, 82vh)`。390px 幅で 367px → 585px。
  - 中心は画面の約 2/3 の高さ。
- カメラ:
  - 距離 3.5 → 2.12（シェーダーの uniform）
  - 経度 124° → 150°、緯度 20° → 36°
  - 太陽は接近に合わせて正面寄りへ
- ライン:
  - 白（#F4F7FC / #DCEAF7、淡い青白のグロー）
  - 大阪（34.6937, 135.5023）発、15本
  - 大円航路を初期化時に 81点 × 15本で計算し、毎フレームは回転と投影のみ
  - 視線と球の交差判定で裏側を隠す
  - 水平線に向けてフェードアウト
- スクロール:
  - トラックは PC 340vh、スマホ 290vh
  - カット境界は 0.20 / 0.43 / 0.76
  - 文字は 0.64 以降に表示し、文字が出るとラインの明るさを 62% に落とす
- 静止画像: V1.3 の完成フレームから再生成（`globe-fallback-v13-1024.webp`、約50KB）。旧 `globe-fallback-768.webp` は削除。

## 検証
- tsc、eslint、`bun run check:booking`、`npx next build`（公開モード）: OK
- 機能（PC 1440、PC 1920、スマホ 390、スマホ 360）:
  - cut 1→4 に進み、逆スクロールで cut 1 に戻る
  - 横スクロール 0、コンソールエラー 0
  - CTA → /v1/about
  - 画面外の描画 0、一時停止中の描画 0
  - WebGL なしは静止画像
  - 動きを減らす設定は still（1画面分）
  - キーボードのフォーカスで全文表示
- 公開モード（ポート3099で一時起動し、確認後に停止）:
  - TOP に地球の参照は 0件
  - /about は 404
  - 公開6ページは 200
  - sitemap は7件
- 性能（ヘッドレス、SwiftShader のソフトウェア描画）:
  - ライン描画は 約0.8ms/フレーム
  - 地球本体は PC 1008px で 約14fps。実機 GPU の値ではない。
  - この環境では数秒後に自動で画質を下げ、その後静止画像へ切り替わった（設計どおり）。
  - 機能検証は描画解像度を下げて（deviceScaleFactor 0.5）実施した。
- 未検証: 実機（GPU あり）でのフレームレート、iOS Safari、Android Chrome。スクロール録画は未取得。
