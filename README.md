# 光之筆記：由 LLM 維護的攝影作品 Wiki

參考 Karpathy 的 **LLM Wiki** 模式做的攝影作品展示網站。
我只負責拍照和寫拍攝筆記，LLM（Claude Code）依照 `CLAUDE.md` 把它們整理成互相連結的 wiki，網站再把 wiki 展示出來。

## 架構

```
raw/    原始資料（照片＋拍攝筆記），人類放入、LLM 唯讀
wiki/   LLM 寫的知識庫：照片、系列、主題、地點、器材、索引、日誌
網站    index.html + assets/ + data/gallery.json（由 tools/build.py 產生）
```

## 使用方式

1. 把照片放進 `raw/photos/`，拍攝筆記放進 `raw/notes/`。
2. 在 Claude Code 中說：「收錄新照片」。LLM 會建立照片頁、更新相關頁面、索引與日誌，並重建網站資料。
3. 本機預覽：
   ```bash
   python3 tools/build.py
   python3 -m http.server 8000
   # 打開 http://localhost:8000
   ```
4. 推上 GitHub，在 Settings → Pages 選擇從 `main` 分支根目錄部署。

## 常用指令（對 LLM 說）

- 「收錄新照片」— Ingest
- 「我晚上拍的照片有什麼共同點？」— Query
- 「檢查 wiki」— Lint

> 目前 `raw/photos/` 裡是 SVG 佔位圖，換成自己的照片後請同步修改照片頁的 `image` 欄位（或直接請 LLM 重新收錄）。
