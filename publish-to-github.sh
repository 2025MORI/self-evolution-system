#!/bin/bash
# Self-Evolution System GitHub公開スクリプト

echo "🧬 Self-Evolution System をGitHubに公開します..."

# 色付きメッセージ関数
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 現在のディレクトリを確認
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || error "ディレクトリ移動に失敗しました"

# パッケージディレクトリの確認
if [ ! -f "package.json" ]; then
    error "package.jsonが見つかりません。正しいディレクトリで実行してください。"
fi

# 一時ディレクトリの作成
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 必要なファイルをコピー
echo "📦 必要なファイルをコピー中..."
cp -r . "$TEMP_DIR/"
cd "$TEMP_DIR" || error "一時ディレクトリへの移動に失敗しました"

# 不要なファイルを削除
echo "🧹 不要なファイルを削除中..."
rm -rf node_modules
rm -rf coverage
rm -rf dist
rm -rf .git
rm -f .env*
rm -f *.log
find . -name "*.test.ts" -delete
find . -name "*.spec.ts" -delete

# Git初期化
echo "🔧 Gitリポジトリを初期化中..."
git init
git config user.name "Self-Evolution System Contributors"
git config user.email "community@self-evolution.org"

# .gitignoreの作成
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.*
!.env.example

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
.nyc_output/

# Logs
logs/
*.log

# Temporary files
tmp/
temp/
*.tmp
EOF

# GitHub Actionsワークフローの作成
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Upload coverage
      if: matrix.node-version == '18.x'
      uses: codecov/codecov-action@v3
EOF

# CODE_OF_CONDUCT.mdの作成
cat > CODE_OF_CONDUCT.md << 'EOF'
# Contributor Covenant Code of Conduct

## Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, sex characteristics, gender identity and expression,
level of experience, education, socio-economic status, nationality, personal
appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to creating a positive environment
include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

## Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable
behavior and are expected to take appropriate and fair corrective action in
response to any instances of unacceptable behavior.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by contacting the project team at community@self-evolution.org. All
complaints will be reviewed and investigated and will result in a response that
is deemed necessary and appropriate to the circumstances.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.0, available at
https://www.contributor-covenant.org/version/2/0/code_of_conduct.html
EOF

# SECURITY.mdの作成
cat > SECURITY.md << 'EOF'
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Self-Evolution System, please send an email to security@self-evolution.org. All security vulnerabilities will be promptly addressed.

Please do not publicly disclose the issue until it has been addressed by the team.
EOF

# CHANGELOG.mdの作成
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-27

### Added
- Initial release of Self-Evolution System
- Core self-monitoring capabilities
- AI-driven solution generation
- Continuous learning engine
- Knowledge transfer between systems
- Real-time WebSocket updates
- REST API endpoints
- Web dashboard UI

### Features
- Automatic challenge detection
- Solution recommendation system
- Learning from execution results
- Pattern recognition
- Multi-system knowledge sharing
EOF

# package.jsonの更新（GitHub用）
echo "📝 package.jsonを更新中..."
node -e "
const pkg = require('./package.json');
pkg.name = '@self-evolution/core';
pkg.version = '1.0.0';
pkg.description = 'AI-driven self-evolving system for automatic monitoring, problem detection, and solution generation';
pkg.keywords = ['self-evolution', 'ai', 'monitoring', 'automation', 'machine-learning'];
pkg.homepage = 'https://github.com/self-evolution-system/core#readme';
pkg.bugs = {
  url: 'https://github.com/self-evolution-system/core/issues'
};
pkg.repository = {
  type: 'git',
  url: 'git+https://github.com/self-evolution-system/core.git'
};
pkg.author = 'Self-Evolution System Contributors';
pkg.license = 'MIT';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# npmパッケージ公開準備
echo "📦 npm公開の準備中..."
cat > .npmignore << 'EOF'
# Source files
src/
tests/
examples/

# Config files
.github/
.gitignore
.npmignore
tsconfig.json
jest.config.js

# Documentation
docs/
*.md
!README.md
!LICENSE
!CHANGELOG.md

# Development files
coverage/
.nyc_output/
*.log
.env*
EOF

# すべてのファイルをステージング
git add -A

# 初期コミット
git commit -m "🎉 Initial release: Self-Evolution System v1.0.0

- AI-driven self-monitoring and problem detection
- Automatic solution generation and execution
- Continuous learning from results
- Knowledge transfer between systems
- Real-time updates via WebSocket
- Comprehensive REST API
- MIT License for maximum freedom

🌍 A gift to humanity - Free to use, modify, and share!"

# リモートリポジトリの設定確認
echo ""
echo "🚀 公開の準備が完了しました！"
echo ""
echo "次の手順を実行してください："
echo ""
echo "1. GitHubで新しいリポジトリを作成:"
echo "   - リポジトリ名: self-evolution-system"
echo "   - 説明: AI-driven self-evolving system for automatic monitoring and solution generation"
echo "   - Public リポジトリとして作成"
echo "   - READMEやライセンスは追加しない（既に含まれているため）"
echo ""
echo "2. 以下のコマンドを実行:"
echo "   cd $TEMP_DIR"
echo "   git remote add origin https://github.com/YOUR_USERNAME/self-evolution-system.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. npmに公開する場合:"
echo "   npm login"
echo "   npm publish --access public"
echo ""
echo "4. GitHubでトピックを追加:"
echo "   self-evolution, ai, monitoring, automation, opensource, mit-license"
echo ""
success "準備完了！世界に貢献しましょう！ 🌍"

# 一時ディレクトリのパスを表示
echo ""
echo "📁 準備されたファイルの場所: $TEMP_DIR"
echo "   （このスクリプト終了後も保持したい場合は、別の場所にコピーしてください）"