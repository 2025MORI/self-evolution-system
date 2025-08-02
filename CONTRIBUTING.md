# Contributing to Self-Evolution System

🎉 まず、貢献を検討していただきありがとうございます！ 🎉

Self-Evolution Systemは、すべての貢献を歓迎します。コードの改善、バグ修正、ドキュメントの更新、新機能の提案など、どんな貢献も価値があります。

## 📋 目次

- [行動規範](#行動規範)
- [はじめに](#はじめに)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [貢献の方法](#貢献の方法)
- [コーディング規約](#コーディング規約)
- [コミットメッセージ](#コミットメッセージ)
- [プルリクエスト](#プルリクエスト)
- [Issue の報告](#issue-の報告)
- [質問とサポート](#質問とサポート)

## 行動規範

このプロジェクトは[Contributor Covenant](https://www.contributor-covenant.org/)を採用しています。参加することで、この行動規範を守ることに同意したものとみなされます。

## はじめに

### 必要な知識

- TypeScript/JavaScript
- Node.js開発の基礎
- Gitの基本的な使い方
- （オプション）システムモニタリング、AI/MLの基礎知識

### 貢献の種類

- 🐛 **バグ修正**: 既存の問題を修正
- ✨ **新機能**: 新しい機能の追加
- 📝 **ドキュメント**: ドキュメントの改善
- 🎨 **リファクタリング**: コードの品質向上
- ✅ **テスト**: テストカバレッジの向上
- 🌐 **国際化**: 多言語対応

## 開発環境のセットアップ

### 1. リポジトリのフォーク

GitHubでこのリポジトリをフォークし、ローカルにクローンします：

```bash
git clone https://github.com/your-username/self-evolution-system.git
cd self-evolution-system
```

### 2. 依存関係のインストール

```bash
npm install
cd packages/self-evolution
npm install
```

### 3. 開発環境の起動

```bash
# TypeScriptのウォッチモード
npm run dev

# テストの実行
npm test

# リントの実行
npm run lint
```

### 4. ブランチの作成

```bash
git checkout -b feature/your-feature-name
# または
git checkout -b fix/issue-number
```

## 貢献の方法

### 小さな変更（タイポ修正など）

1. 直接編集してプルリクエストを送信

### 大きな変更

1. まずIssueを作成して議論
2. 承認後、実装を開始
3. テストを書く
4. ドキュメントを更新
5. プルリクエストを送信

## コーディング規約

### TypeScript/JavaScript

```typescript
// ✅ 良い例
export class SelfEvolutionSystem extends EventEmitter {
  private challenges: Map<string, SystemChallenge> = new Map();
  
  /**
   * 課題を記録
   * @param challenge - 記録する課題
   * @returns 課題ID
   */
  public recordChallenge(challenge: Partial<SystemChallenge>): string {
    // 実装
  }
}

// ❌ 悪い例
export class self_evolution_system extends EventEmitter {
  challenges = new Map();
  
  // コメントなし
  record_challenge(c) {
    // 実装
  }
}
```

### 命名規則

- **クラス**: PascalCase (例: `SelfEvolutionSystem`)
- **関数・変数**: camelCase (例: `recordChallenge`)
- **定数**: UPPER_SNAKE_CASE (例: `MAX_RETRIES`)
- **ファイル**: PascalCase（クラス）、camelCase（その他）

### ファイル構造

```
src/
├── core/           # コア機能
├── monitors/       # 監視系
├── generators/     # 生成系
├── learning/       # 学習系
├── transfer/       # 転送系
└── types/          # 型定義
```

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) を使用します：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更
- `refactor`: バグ修正でも機能追加でもないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### 例

```
feat(monitor): メモリリーク検出機能を追加

長時間実行時のメモリ使用量を監視し、異常なメモリ増加を
検出する機能を実装しました。

Closes #123
```

## プルリクエスト

### PRを作成する前に

- [ ] すべてのテストが通過している
- [ ] リントエラーがない
- [ ] 新機能の場合、テストを追加している
- [ ] ドキュメントを更新している
- [ ] CHANGELOGを更新している（大きな変更の場合）

### PRテンプレート

```markdown
## 概要
変更の簡潔な説明

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 破壊的変更
- [ ] ドキュメント更新

## 変更内容
- 具体的な変更点1
- 具体的な変更点2

## テスト
テスト方法の説明

## チェックリスト
- [ ] コードは規約に従っている
- [ ] テストを追加/更新した
- [ ] ドキュメントを更新した
- [ ] CHANGELOGを更新した
```

### レビュープロセス

1. 自動テストが通過
2. コードレビュー（最低1人）
3. 承認後、メンテナーがマージ

## Issue の報告

### バグレポート

```markdown
## 環境
- OS: [例: Ubuntu 20.04]
- Node.js: [例: 16.14.0]
- パッケージバージョン: [例: 1.0.0]

## 再現手順
1. 手順1
2. 手順2
3. 手順3

## 期待される動作
説明

## 実際の動作
説明

## エラーログ
```
エラーメッセージ
```

## その他
スクリーンショットなど
```

### 機能リクエスト

```markdown
## 概要
提案する機能の説明

## 動機
なぜこの機能が必要か

## 提案する解決策
どのように実装するか

## 代替案
他の解決方法

## その他
参考情報など
```

## 質問とサポート

### 質問がある場合

1. [ドキュメント](docs/)を確認
2. [既存のIssue](https://github.com/yourusername/self-evolution-system/issues)を検索
3. [Discussions](https://github.com/yourusername/self-evolution-system/discussions)で質問

### コミュニティ

- 💬 [Discord](https://discord.gg/self-evolution)
- 🐦 [Twitter](https://twitter.com/selfevolution)
- 📧 メーリングリスト: dev@self-evolution.org

## ライセンス

貢献することで、あなたのコードがApache License 2.0の下でライセンスされることに同意したものとみなされます。

## 🙏 謝辞

すべての貢献者に感謝します！あなたの貢献がこのプロジェクトを素晴らしいものにしています。

---

質問がある場合は、遠慮なくIssueを作成するか、Discussionsで議論を始めてください。Happy coding! 🚀