#!/bin/bash

echo "アフィリエイトポータルMVPを起動します..."

# バックエンドの依存関係をインストール
echo "バックエンドの依存関係をインストール中..."
cd backend
npm install

# バックエンドを起動
echo "バックエンドサーバーを起動中..."
npm run dev &
BACKEND_PID=$!

# フロントエンドに戻る
cd ..

# フロントエンドの依存関係をインストール
echo "フロントエンドの依存関係をインストール中..."
npm install

# フロントエンドを起動
echo "フロントエンドアプリを起動中..."
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "アフィリエイトポータルが起動しました！"
echo "========================================"
echo ""
echo "フロントエンド: http://localhost:3000"
echo "バックエンドAPI: http://localhost:3001"
echo ""
echo "デモアカウント:"
echo "ユーザー名: admin"
echo "パスワード: admin123"
echo ""
echo "終了するには Ctrl+C を押してください"
echo ""

# 終了待ち
wait $BACKEND_PID
wait $FRONTEND_PID