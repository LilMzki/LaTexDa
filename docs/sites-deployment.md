# Sitesデプロイ手順

この文書は、LaTeXDaをSitesのbuildless Worker構成へ移してデプロイする手順です。

## 重要な前提

GitHubの`LilMzki/LaTexDa`リポジトリと、Sitesが管理するサイトのチェックアウトは別物です。このリポジトリの`.openai/hosting.json`には、まだSitesプロジェクト固有の`project_id`を入れていません。IDを推測して追加せず、Sitesのサイト作成時に自動生成された値を使ってください。

したがって、GitHubのブランチをそのままSitesへ直接デプロイするのではなく、Sites管理下のWorkerチェックアウトを作成し、そこへこのリポジトリの内容を反映します。

## 1. Sites管理下のチェックアウトを作成する

Sitesスキルで、buildless Worker starterを使って新しいサイトを1回だけ作成します。

```bash
python3 "$(dirname "<sites-building SKILL.mdの絶対パス>")/../sites-hosting/scripts/sites.py" create \
  --title "LaTeXDa" \
  --slug "latexda" \
  --starter worker
```

コマンドが返す`checkout_path`を、以降のSitesチェックアウトとして使用します。作成時にSitesが`.openai/hosting.json`へ`project_id`を書き込みます。

既存のSitesサイトを更新する場合は、Sitesスキルの`edit`でそのサイトのチェックアウトを開きます。

## 2. GitHubの変更をSitesチェックアウトへ反映する

PR `agent/sites-deployable`（PR #3）の内容を、Sitesチェックアウトへ反映します。最低限、次のファイルとディレクトリを反映します。

```text
index.html
styles.css
styles/
src/
package.json
scripts/
worker/
```

`.openai/hosting.json`はSitesチェックアウト側のものを保持してください。GitHubリポジトリ側のマニフェストで上書きして、`project_id`を失わないようにします。

反映後の構成は、次の条件を満たす必要があります。

- `package.json`に`build`と`validate`スクリプトがある
- `scripts/build.sh`がWorker成果物を生成する
- `scripts/validate-artifact.mjs`が成果物を検証できる
- `worker/index.js`がHTML、CSS、JavaScriptを配信する
- `.openai/hosting.json`にSites作成時の`project_id`がある

## 3. デプロイ前に検証する

Sitesチェックアウトのルートで実行します。

```bash
node --check src/game-engine.js
node --check src/questions.js
node --check src/app.js
node --test
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

検証が成功すると、次の成果物が生成されます。

```text
dist/
├── .openai/hosting.json
└── server/
    └── index.js
```

`dist/server/index.js`はES Moduleとして読み込め、`default.fetch`を公開している必要があります。

buildless Worker starterには互換性のある開発サーバーがないため、通常のSitesエージェントプレビューは行いません。成果物検証を完了してから、Sitesのチェックポイントへ進みます。

## 4. チェックポイントを作成する

デプロイを開始する操作です。実行すると本番デプロイが開始されるため、公開してよい状態を確認してから実行します。

```bash
python3 "$(dirname "<sites-building SKILL.mdの絶対パス>")/../sites-hosting/scripts/sites.py" checkpoint \
  --path "<checkout_path>" \
  --message "Deploy LaTeXDa Worker"
```

チェックポイント後は、Sitesのデプロイ状態が`succeeded`になるまで確認し、返された本番URLを利用します。

このPRの作成時点では、Sitesサイトの作成・チェックポイント・本番デプロイは実行していません。

## 注意事項

- KaTeXのCSSとJavaScriptはjsDelivr CDNから読み込むため、公開後の数式表示には外部ネットワーク接続が必要です。
- `localStorage`に保存されるハイスコアはブラウザごとのローカルデータで、Sites側の永続データではありません。
- `.openai/hosting.json`の`project_id`はSites固有の値です。手入力、推測、別サイトの値の流用はしないでください。
