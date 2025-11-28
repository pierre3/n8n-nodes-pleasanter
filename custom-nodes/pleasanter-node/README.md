# n8n-nodes-pleasanter

[Pleasanter](https://pleasanter.org/) API と連携するための n8n カスタムノードです。

## 機能

- **Get**: テーブルから単一または複数のレコードを取得
- **Create**: 新しいレコードを作成
- **Update**: 既存のレコードを更新
- **Delete**: レコードを削除

## インストール

### Docker環境での利用

1. ビルド＆デプロイスクリプトを実行:

```powershell
cd custom-nodes/pleasanter-node
.\deploy.ps1 -Restart
```

2. n8nコンテナが再起動され、カスタムノードが利用可能になります。

### 手動インストール

```bash
cd custom-nodes/pleasanter-node
npm install
npm run build
```

ビルド成果物（`dist/` と `package.json`）を n8n のカスタムノードディレクトリにコピーしてください。

## 使い方

### 1. クレデンシャルの設定

1. n8n で「Credentials」→「Add Credential」→「Pleasanter API」を選択
2. 以下を設定:
   - **Base URL**: Pleasanter サーバーの URL（例: `http://host.docker.internal:59803`）
   - **API Key**: Pleasanter で発行した API キー

> **Note**: Docker コンテナからホストPC上の Pleasanter にアクセスする場合は、`localhost` の代わりに `host.docker.internal` を使用してください。

### 2. ノードの使用

#### Get（レコード取得）

- **Site ID or Record ID**: テーブルの Site ID（複数レコード取得）または Record ID（単一レコード取得）
- **View Options**: フィルター、ソート、検索条件などを指定

#### Create（レコード作成）

- **Site ID**: レコードを作成するテーブルの Site ID
- **Fields**: Title, Body, ClassHash, NumHash などのフィールド値

#### Update（レコード更新）

- **Record ID**: 更新するレコードの ID
- **Fields**: 更新するフィールド値

#### Delete（レコード削除）

- **Record ID**: 削除するレコードの ID

## 開発

### プロジェクト構成

```
pleasanter-node/
├── credentials/
│   └── PleasanterApi.credentials.ts  # API認証情報の定義
├── nodes/
│   └── pleasanter/
│       ├── Pleasanter.node.ts        # メインノードの実装
│       └── pleasanter.svg            # アイコン
├── dist/                             # ビルド成果物（.gitignore）
├── package.json
├── tsconfig.json
└── deploy.ps1                        # デプロイスクリプト
```

### カスタムノード作成手順

#### 1. テンプレートリポジトリをクローン

```bash
# n8n公式のスターターテンプレートをクローン
git clone https://github.com/n8n-io/n8n-nodes-starter.git my-node-name
cd my-node-name

# 元のGit履歴を削除して新しいリポジトリとして初期化
rm -rf .git
git init
```

#### 2. 不要なサンプルファイルを削除

```bash
# サンプルノードとクレデンシャルを削除
rm -rf nodes/ExampleNode
rm -rf nodes/HttpBin
rm -rf credentials/ExampleCredentialsApi.credentials.ts
rm -rf credentials/HttpBinApi.credentials.ts
```

#### 3. 依存パッケージをインストール

```bash
npm install
```

#### 4. package.json を編集

- `name`: パッケージ名（例: `n8n-nodes-pleasanter`）
- `description`: 説明
- `author`: 作成者情報
- `repository`: リポジトリURL
- `n8n.credentials`: クレデンシャルファイルのパス
- `n8n.nodes`: ノードファイルのパス

#### 5. クレデンシャルの定義（`credentials/PleasanterApi.credentials.ts`）

```typescript
import type {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class PleasanterApi implements ICredentialType {
    name = 'pleasanterApi';
    displayName = 'Pleasanter API';
    properties: INodeProperties[] = [
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://pleasanter.net',
            required: true,
        },
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
        },
    ];
}
```

#### 3. ノードの実装（`nodes/pleasanter/Pleasanter.node.ts`）

```typescript
import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

export class Pleasanter implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Pleasanter',
        name: 'pleasanter',
        icon: 'file:pleasanter.svg',
        group: ['transform'],
        version: 1,
        description: 'Interact with Pleasanter API',
        defaults: { name: 'Pleasanter' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            { name: 'pleasanterApi', required: true },
        ],
        properties: [
            // プロパティ定義
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        // 実行ロジック
    }
}
```

#### 4. package.json の設定

```json
{
    "n8n": {
        "n8nNodesApiVersion": 1,
        "credentials": [
            "dist/credentials/PleasanterApi.credentials.js"
        ],
        "nodes": [
            "dist/nodes/pleasanter/Pleasanter.node.js"
        ]
    }
}
```

#### 5. ビルドとテスト

```bash
# ビルド
npm run build

# リント
npm run lint
```

### Docker 環境でのデプロイ

`docker-compose.yml` でカスタムノードをマウント:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - /c/n8n/nodes:/home/node/.n8n/custom-nodes
```

## API リファレンス

- [Pleasanter API マニュアル](https://pleasanter.org/manual/api)

## ライセンス

MIT
