#!/usr/bin/env bash
ws=workspace
zip_file_name=AXON_html_`eval date '+%Y%m%d-%H%M%S'`.zip
# build
rm -rf $ws
echo 'building...'
npm run build

# copy to ws
echo 'copy to workspace...'
if [ ! -d $ws ]
then
  mkdir $ws
fi
# sukudo以下のディレクトリを生成
mkdir -p $ws
# destをコピー
cp -r dest $ws

# 不要なファイルを削除
# rm -f $ws/pc/javascripts/lib/createjs-2015.05.21.combined.js
# rm -f $ws/pc/javascripts/lib/parallax.min.js
# rm -f $ws/common/json/images2.json
# rm -f $ws/demo.html
# あまり更新されないかもしれないファイル（おこのみで）
# rm -rf $ws/common/beetle_images
# rm -rf $ws/common/fonts
# rm -rf $ws/common/images
# rm -rf $ws/common/json
# rm -rf $ws/ie8/images
# rm -rf $ws/android2/images


if [ -n "$1" -a "$1" = "excommon" ]; then
  rm -rf $ws
fi

echo 'zipping...'
# zip化
cd $ws/dest
zip  ../$zip_file_name -r .
cd ../..

# 削除
rm -rf $ws/dest
echo 'done! -> ' $zip_file_name
