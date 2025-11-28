# カスタムノードのデプロイ方法

## 概要

`custom-nodes/pleasanter-node` のビルド成果物を n8n Docker コンテナで利用できるようにデプロイする仕組みです。

## ディレクトリ構成

```
c:\n8n\
├── docker-compose.yml
├── custom-nodes/
│   └── pleasanter-node/     # ソースコード
│       ├── deploy.ps1       # デプロイスクリプト
│       └── ...
└── nodes/
    └── n8n-nodes-pleasanter/ # デプロイ先（ビルド成果物）
        ├── dist/
        └── package.json
```

## 使い方

### 1. ビルド＆デプロイ

PowerShell で以下を実行：

```powershell
cd c:\n8n\custom-nodes\pleasanter-node
.\deploy.ps1
```

### 2. ビルド＆デプロイ＆n8n再起動

```powershell
.\deploy.ps1 -Restart
```

### 3. ビルドをスキップしてデプロイのみ

```powershell
.\deploy.ps1 -SkipBuild
```

## docker-compose.yml の設定

以下の設定により、カスタムノードが n8n で読み込まれます：

```yaml
services:
  n8n:
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
    volumes:
      - /c/n8n/nodes:/home/node/.n8n/custom-nodes
```

## 手動でのデプロイ

スクリプトを使わずに手動でデプロイする場合：

1. ビルド
   ```powershell
   cd c:\n8n\custom-nodes\pleasanter-node
   npm install
   npm run build
   ```

2. 成果物をコピー
   ```powershell
   Copy-Item -Path dist -Destination c:\n8n\nodes\n8n-nodes-pleasanter\ -Recurse
   Copy-Item -Path package.json -Destination c:\n8n\nodes\n8n-nodes-pleasanter\
   ```

3. n8n コンテナを再起動
   ```powershell
   cd c:\n8n
   docker-compose restart n8n
   ```

## トラブルシューティング

### カスタムノードが表示されない

1. n8n コンテナを再起動してみてください
   ```powershell
   docker-compose restart n8n
   ```

2. ログを確認
   ```powershell
   docker-compose logs -f n8n
   ```

3. デプロイ先のファイルを確認
   ```powershell
   ls c:\n8n\nodes\n8n-nodes-pleasanter
   ```
