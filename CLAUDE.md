# CLAUDE.md — 光之筆記：由 LLM 維護的攝影作品 Wiki 與展示網站

> 本文件是這個專案的「schema」。每次開始工作前，先完整讀過這份文件，再依照裡面的規則行動。
> 本專案參考 Andrej Karpathy 提出的 **LLM Wiki** 模式：LLM 不是每次都從原始資料重新找答案，
> 而是**持續建立並維護一個互相連結的 Markdown wiki**，再由網站把這個 wiki 展示出來。

---

## 1. 專案目的

- 收藏並展示我的攝影作品，網站可部署在 **GitHub Pages** 公開瀏覽。
- 每張照片不只是一張圖，而是 wiki 裡的一個「頁面」：有拍攝故事、地點、器材、主題、系列，彼此互相連結。
- 我（人類）負責：拍照、把照片與拍攝筆記放進 `raw/`、提出問題、決定重點。
- 你（LLM）負責：閱讀原始資料、撰寫與更新 wiki 頁面、維護交叉連結、更新索引與日誌、重建網站資料。

---

## 2. 三層架構

| 層 | 位置 | 誰寫 | 說明 |
|---|---|---|---|
| 原始資料 | `raw/` | 人類 | 照片檔與拍攝筆記。**唯讀，LLM 絕對不可修改、改名或刪除。** |
| Wiki | `wiki/` | LLM | 照片頁、系列頁、主題頁、地點頁、器材頁、總覽、索引、日誌。LLM 完全擁有這一層。 |
| 網站 | `index.html`、`assets/`、`data/` | LLM | 靜態網站。`data/gallery.json` 由 `tools/build.py` 從 wiki 自動產生，**不要手動編輯**。 |

本文件（`CLAUDE.md`）是第四個角色：規則書。我和你會一起隨時間修改它。

---

## 3. 目錄結構

```
photo-wiki/
├── CLAUDE.md              ← 本文件（schema）
├── README.md              ← 給人看的專案說明
├── index.html             ← 網站入口（GitHub Pages 從這裡開始）
├── assets/
│   ├── style.css
│   └── app.js             ← 讀取 data/gallery.json 並渲染頁面
├── data/
│   └── gallery.json       ← 由 tools/build.py 產生，勿手改
├── tools/
│   └── build.py           ← 掃描 wiki/ 的 frontmatter → 產生 gallery.json
├── raw/                   ← 原始資料（唯讀）
│   ├── photos/            ← 照片檔（.jpg / .png / .webp / .svg）
│   └── notes/             ← 拍攝筆記（.md，一次外拍一份）
└── wiki/                  ← LLM 維護的知識庫
    ├── index.md           ← 內容目錄（每次 ingest 都要更新）
    ├── log.md             ← 時間序日誌（只能附加，不可改寫舊紀錄）
    ├── overview.md        ← 作品集總覽與「我的攝影風格」綜合分析
    ├── photos/            ← 一張照片一頁
    ├── series/            ← 系列作品（一組有共同主軸的照片）
    ├── themes/            ← 主題／概念（例：藍調時刻、倒影、街頭人物）
    ├── places/            ← 拍攝地點
    └── gear/              ← 相機與鏡頭
```

---

## 4. 頁面格式

每個 wiki 頁面都是 Markdown，開頭必須有 YAML frontmatter。
`slug` 必須與檔名（不含 `.md`）相同，且全站唯一。

### 4.1 照片頁 `wiki/photos/<slug>.md`

```markdown
---
type: photo
title: 港邊的藍色時刻
slug: 2026-10-harbor-blue-hour
image: raw/photos/2026-10-harbor-blue-hour.svg
date: 2026-10-12
place: harbor-pier
series: [harbor-nights]
themes: [blue-hour, reflection]
gear: [mirrorless-x, lens-23mm]
exif:
  focal: 23mm
  aperture: f/2.8
  shutter: 1/30s
  iso: 800
featured: true
sources: [raw/notes/2026-10-12-harbor.md]
---

一句話描述這張照片（會顯示在卡片上）。

## 拍攝故事
## 技術筆記
## 相關
- [[harbor-nights]]、[[blue-hour]]
```

### 4.2 系列頁 `wiki/series/<slug>.md`

frontmatter：`type: series`、`title`、`slug`、`cover`（某張照片的 slug）、`period`（例：2026-09 ~ 2026-11）。
內文：系列主旨、照片清單（用 `[[slug]]`）、這個系列的演變。

### 4.3 主題頁 `wiki/themes/<slug>.md`

frontmatter：`type: theme`、`title`、`slug`。
內文：這個主題是什麼、我怎麼拍它、代表作品、跟其他主題的關係。

### 4.4 地點頁 `wiki/places/<slug>.md`

frontmatter：`type: place`、`title`、`slug`、`region`。
內文：地點特色、最佳拍攝時段、在這裡拍過的照片。

### 4.5 器材頁 `wiki/gear/<slug>.md`

frontmatter：`type: gear`、`title`、`slug`、`kind`（camera / lens / other）。
內文：使用心得、用它拍過的代表作。

### 4.6 共同規則

- 內部連結一律寫 `[[slug]]`，網站會自動轉成可點的連結。
- 列表型欄位用 `[a, b]` 寫在同一行；`exif` 是唯一允許縮排子欄位的欄位。
- 只寫照片與筆記中**有根據**的內容。推測要標明「（推測）」。
- 若新資料與舊頁面矛盾（例：地點寫錯、日期不同），在兩邊頁面都加上 `> ⚠️ 矛盾：...` 註記，並記入 log，不要默默覆蓋。

---

## 5. 命名規則

- slug 只用小寫英文、數字、連字號：`2026-10-harbor-blue-hour`。
- 照片 slug 格式：`YYYY-MM-<簡短英文描述>`，與 `raw/photos/` 中的檔名一致。
- 我給的照片（聊天貼上或壓縮檔）由你**複製**進 `raw/photos/` 並改成 slug 檔名；
  相機原檔名（例：`DSC_0126.JPG`）記在照片頁的 `original` 欄位。放進 `raw/` 之後就不再動它。
- 日期與相機參數優先從照片 EXIF 讀取。聊天貼上的照片通常沒有 EXIF：缺的欄位就省略，日期若是推測要在內文寫明依據。
- 還不知道的欄位（例：地點）留空 `place:`，並在 log 記為「待補」，不要猜。
- 拍攝筆記檔名：`raw/notes/YYYY-MM-DD-<地點或活動>.md`。
- 頁面標題（`title`）用中文。

---

## 6. 工作流程

### 6.1 Ingest（收錄新照片）

當我說「收錄」、「ingest」或「我放了新照片」時：

1. 列出 `raw/photos/` 與 `raw/notes/` 中**尚未出現在 `wiki/index.md` 的檔案**。
2. 讀取拍攝筆記；能看圖時也看照片本身。
3. 先用 3～5 點跟我說你的重點整理，問我有沒有要強調或修正的地方（我說「直接做」就跳過這步）。
4. 為每張照片建立照片頁。
5. 更新或建立相關的系列、主題、地點、器材頁——**新照片必須被至少一個其他頁面連結**。
6. 檢查 `wiki/overview.md` 的風格分析是否需要修正。
7. 更新 `wiki/index.md`。
8. 在 `wiki/log.md` 附加一筆紀錄。
9. 執行 `python3 tools/build.py`，重建 `data/gallery.json`。
10. 最後回報：新增了哪些頁、修改了哪些頁。

一次收錄通常會動到 5～10 個檔案，這是正常的。

### 6.2 Query（提問）

當我問關於作品集的問題（例：「我哪些照片用了倒影？」「我晚上拍的照片有什麼共同點？」）：

1. 先讀 `wiki/index.md` 找相關頁面，再讀進去。
2. 回答時用 `[[slug]]` 標出引用的頁面。
3. 如果答案有保存價值（比較、分析、新發現的關聯），問我要不要存成新頁面
   （通常放在 `wiki/themes/` 或 `wiki/series/`），存了就照 Ingest 第 7～9 步更新。

### 6.3 Lint（健康檢查）

當我說「lint」或「檢查 wiki」時，找出並列出：

- 沒有被任何頁面連結的孤兒頁
- `[[slug]]` 指向不存在頁面的斷鏈
- frontmatter 缺少必要欄位、或 `image` 檔案不存在
- 頁面間互相矛盾的資訊
- 被提到很多次卻沒有自己頁面的主題或地點
- `raw/` 中尚未收錄的檔案

先列報告，等我同意後再修。修完寫入 log 並重建網站資料。

### 6.4 Publish（發布）

1. 執行 `python3 tools/build.py`，確認沒有錯誤或警告。
2. 本機預覽：`python3 -m http.server 8000`，打開 `http://localhost:8000`。
3. 提交 git 並推上 GitHub，GitHub Pages 會從 repo 根目錄的 `index.html` 部署。

---

## 7. index.md 與 log.md 規範

**`wiki/index.md`**：依類別分區（照片 / 系列 / 主題 / 地點 / 器材），每行一頁：

```
- [[slug]] — 一行摘要（日期或照片數）
```

**`wiki/log.md`**：只能在最後附加，每筆開頭固定格式，方便用 `grep "^## \[" wiki/log.md` 查詢：

```
## [YYYY-MM-DD] ingest | 收錄 3 張港邊夜拍
- 新增：...
- 更新：...
```

動作類型只用：`ingest`、`query`、`lint`、`publish`、`schema`（修改本文件時）。

---

## 8. 網站規範

- 純靜態：HTML + CSS + 原生 JavaScript，不用建置框架；Markdown 由 CDN 的 `marked` 渲染。
- 網站只讀 `data/gallery.json`，不直接解析 wiki 檔案。
- 原圖可能很大（10MB 以上），網站一律顯示 `tools/build.py` 自動產生的 `data/img/<slug>.jpg`（長邊 2000px，需安裝 Pillow）。`data/img/` 和 `gallery.json` 一樣不要手動編輯。
- 頁面路由用 hash：`#/`、`#/photo/<slug>`、`#/series/<slug>`、`#/theme/<slug>`、`#/place/<slug>`、`#/gear/<slug>`、`#/about`。
- 首頁顯示照片牆，可依主題篩選；`featured: true` 的照片排在前面。
- 風格：深色背景、讓照片當主角、文字簡潔；手機版也要好看。
- 修改網站程式後，至少用本機伺服器打開首頁與一個照片頁確認正常。

---

## 9. 禁止事項

- ❌ 修改、移動、刪除 `raw/` 裡的任何檔案。
- ❌ 手動編輯 `data/gallery.json`。
- ❌ 改寫或刪除 `wiki/log.md` 的舊紀錄。
- ❌ 編造照片中沒有、筆記也沒寫的拍攝資訊（EXIF、地點、日期）。
- ❌ 在網站放入照片中可辨識的陌生人姓名或私人資訊。

---

## 10. 我的偏好

- 所有 wiki 內容與網站文字用**繁體中文**，slug 用英文。
- 照片描述語氣：簡短、有畫面感，不要過度形容。
- 不確定的事先問我，不要猜。
- 這份 CLAUDE.md 可以隨時改：如果你發現某個流程常常不順，提議修改並記入 log（類型 `schema`）。
