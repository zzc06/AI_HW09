# Wiki 日誌

> 只能在最後附加。查最近 5 筆：`grep "^## \[" wiki/log.md | tail -5`

## [2026-11-16] schema | 建立專案與 CLAUDE.md
- 建立 raw / wiki / 網站三層架構

## [2026-11-16] ingest | 港邊夜拍（2026-10-12）
- 新增：2026-10-harbor-blue-hour、2026-10-pier-reflection、harbor-nights、blue-hour、reflection、harbor-pier、mirrorless-camera、lens-23mm
- 更新：overview、index

## [2026-11-16] ingest | 老街散步（2026-11-02）
- 新增：2026-11-alley-noon、light-in-dark、street、old-street
- 更新：overview（新增「暗中有一道光」的風格觀察）、index、lens-23mm、mirrorless-camera

## [2026-11-16] schema | 移除示範內容、加入網頁縮圖
- 刪除建立專案時的 3 張 SVG 佔位圖、2 份範例筆記及其 wiki 頁面（皆為示範，非使用者資料）
- tools/build.py 新增：自動把原圖縮成 data/img/<slug>.jpg（長邊 2000px）供網站使用
- 照片頁新增 `original` 欄位，記錄相機原檔名

## [2026-11-16] ingest | 2024 冬日賞花（5 張）
- 新增：2024-12-pink-flower-sea、2024-12-bougainvillea-peek、2024-12-bougainvillea-peek-closer、2024-12-chrysanthemum-poinsettia、2024-12-bougainvillea-backlit、winter-flowers-2024、shallow-depth、foreground-bokeh、backlight、color-layers、nikon-d5300
- 更新：overview、index
- 待補：拍攝地點、鏡頭型號；DSC_0126 / 0158 / 0188 無 EXIF，日期為推測
