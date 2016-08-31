# websocket-vj-test

スマートフォンから、canvas上で描いた絵をwebSocket通信を使って、webgl上に描画するウェブアプリ。
![websocket-vj](https://github.com/internship-frontend-2016/websocket-vj-test/blob/master/logo.png)
## 各バージョン

以下のバージョンで動作します

```
Node.js: v4.5.0
```

## 構造
```
├─ build	  // コンパイル先ディレクトリ
│
├─ gulp   // gulpファイル
│   ├── config.js  // パス等設定ファイル
│   ├── tasks      // 実行されるタスク
│   └── util
│
│
├── src    // 開発用ディレクトリ
│   ├── img    // そのままbuild/imgへコピーされる
│   ├── js     // main.jsをコンパイルしてbuildへ
│   │  	├──vj-controller//vj-controller.jsでつかうファイルが入ってる
│   │  	├──vj-controller.js //コントローラのjsファイル
│   │  	└──vj-screen.js //メイン画面のjsファイル
│   ├── sass   // sassファイルをコンパイルしてbuildへ
│   ├── vj-controller
│   │  	└──index.ejs //コンパイルしてbuildへ,コントロール
│   └── index.ejs   // コンパイルしてbuildへ,メインスクリーン
└─index.js //websocket用サーバー
```

### ビルドツール

* Gulp              （ タスクランナー )
* gulp-ejs          （ ejs -> html コンパイル )
* gulp-ruby-sass    （ sass -> css コンパイル )
* browserify        （ jsファイルを統合 )
* js-hint           （ jsファイルのチェック )
* BrowserSync       （ ローカルサーバーを起動 )
* gulp.spritesmith  （ スプライト画像を作成 )


## インストール
```
>npm install
```
## 実行
###srcファイルをコンパイル
```
>gulp
```
###Node.jsでwebsocket用のサーバーを立てる
```
>node index.js
```
