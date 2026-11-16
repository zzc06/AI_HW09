#!/usr/bin/env python3
"""掃描 wiki/ 下所有頁面的 frontmatter，產生 data/gallery.json 給網站使用。

用法（在專案根目錄）：python3 tools/build.py
只用 Python 標準函式庫，不需要安裝套件。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI = ROOT / "wiki"
OUT = ROOT / "data" / "gallery.json"
FOLDERS = {"photos": "photo", "series": "series", "themes": "theme", "places": "place", "gear": "gear"}
LINK = re.compile(r"\[\[([a-z0-9-]+)\]\]")


def parse_value(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        return [x.strip() for x in v[1:-1].split(",") if x.strip()]
    if v in ("true", "false"):
        return v == "true"
    return v.strip('"').strip("'")


def parse_page(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError("缺少 frontmatter")
    _, fm, body = text.split("---", 2)
    meta, parent = {}, None
    for line in fm.splitlines():
        if not line.strip():
            continue
        if line.startswith("  ") and parent:
            k, _, v = line.strip().partition(":")
            meta[parent][k.strip()] = parse_value(v)
            continue
        k, _, v = line.partition(":")
        k = k.strip()
        if v.strip() == "":
            meta[k], parent = {}, k
        else:
            meta[k], parent = parse_value(v), None
    # 空白欄位（例：place: 還沒填）視為空字串，而不是空物件
    meta = {k: ("" if v == {} else v) for k, v in meta.items()}
    meta["body"] = body.strip()
    return meta


def make_web_image(src, slug, warnings):
    """把 raw/ 原圖縮成網頁用的 data/img/<slug>.jpg（長邊 2000px）。原圖不動。"""
    if src.suffix.lower() == ".svg":
        return str(src.relative_to(ROOT))
    out = ROOT / "data" / "img" / f"{slug}.jpg"
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
        return str(out.relative_to(ROOT))
    try:
        from PIL import Image, ImageOps
    except ImportError:
        if not any("Pillow" in w for w in warnings): warnings.append("未安裝 Pillow（pip install pillow），網站直接使用原圖")
        return str(src.relative_to(ROOT))
    out.parent.mkdir(parents=True, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im.thumbnail((2000, 2000))
    im.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    return str(out.relative_to(ROOT))


def main():
    pages, warnings = {}, []
    for folder, ptype in FOLDERS.items():
        for f in sorted((WIKI / folder).glob("*.md")):
            try:
                p = parse_page(f)
            except ValueError as e:
                warnings.append(f"{f.relative_to(ROOT)}: {e}")
                continue
            p.setdefault("type", ptype)
            if p.get("slug") != f.stem:
                warnings.append(f"{f.relative_to(ROOT)}: slug 與檔名不一致")
                p["slug"] = f.stem
            if p["slug"] in pages:
                warnings.append(f"slug 重複：{p['slug']}")
            if ptype == "photo":
                src = ROOT / p.get("image", "")
                if src.is_file():
                    p["web"] = make_web_image(src, p["slug"], warnings)
                else:
                    warnings.append(f"{p['slug']}: 找不到圖片 {p.get('image')}")
            pages[p["slug"]] = p

    overview = WIKI / "overview.md"
    about = parse_page(overview)["body"] if overview.exists() else ""

    # 檢查斷鏈與孤兒頁
    linked = set()
    for p in pages.values():
        for ref in LINK.findall(p["body"]):
            linked.add(ref)
            if ref not in pages:
                warnings.append(f"{p['slug']}: 斷鏈 [[{ref}]]")
        for key in ("place", "series", "themes", "gear", "cover"):
            vals = p.get(key) or []
            linked.update([vals] if isinstance(vals, str) else vals)
    linked.update(LINK.findall(about))
    for slug in pages:
        if slug not in linked:
            warnings.append(f"孤兒頁（沒有被連結）：{slug}")

    # featured 優先，其餘依日期由新到舊
    photos = sorted(
        (p for p in pages.values() if p["type"] == "photo"),
        key=lambda p: (p.get("featured", False), p.get("date", "")),
        reverse=True,
    )
    data = {
        "site": {"title": "光之筆記", "subtitle": "由 LLM 維護的攝影作品 Wiki"},
        "about": about,
        "photos": [p["slug"] for p in photos],
        "pages": pages,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ 已產生 {OUT.relative_to(ROOT)}：{len(photos)} 張照片、{len(pages)} 個頁面")
    for w in warnings:
        print(f"⚠️  {w}")
    return 1 if any("斷鏈" in w or "找不到圖片" in w for w in warnings) else 0


if __name__ == "__main__":
    sys.exit(main())
