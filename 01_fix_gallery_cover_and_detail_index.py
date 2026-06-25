# -*- coding: utf-8 -*-
"""Fix gallery covers and detail page index from assets/page_images.
Run at repository root.
"""
from pathlib import Path
import json, re, copy

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
PAGE_ROOT = ROOT / "assets" / "page_images"
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def clean_title(name):
    return re.sub(r"^\d{3}[_\-\s]*", "", name).strip() or name


def page_no(path, fallback):
    m = re.match(r"^(\d+)", path.stem)
    return int(m.group(1)) if m else fallback


def page_label(path):
    stem = path.stem
    if "_" in stem:
        return stem.split("_", 1)[1]
    if "-" in stem:
        return stem.split("-", 1)[1]
    return ""


def find_works():
    works = {}
    if not PAGE_ROOT.exists():
        print("assets/page_images not found; skip.")
        return works
    for folder in sorted(PAGE_ROOT.iterdir(), key=lambda p: p.name):
        if not folder.is_dir():
            continue
        m = re.match(r"^(\d{3})", folder.name)
        if not m:
            continue
        wid = m.group(1)
        title = clean_title(folder.name)
        img_dir = folder / "images"
        if not img_dir.exists():
            img_dir = folder
        imgs = [p for p in img_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
        imgs.sort(key=lambda p: (page_no(p, 999999), p.name))
        if not imgs:
            continue
        cover = next((p for p in imgs if p.stem.startswith("0001")), imgs[0])
        pages = []
        for i, p in enumerate(imgs, 1):
            pages.append({
                "page": page_no(p, i),
                "label": page_label(p) or str(page_no(p, i)),
                "image": p.relative_to(ROOT).as_posix(),
                "text_clean": "",
                "text_raw": "",
                "char_count": 0,
                "has_char_boxes": False
            })
        works[wid] = {"id": wid, "title": title, "cover": cover.relative_to(ROOT).as_posix(), "pages": pages}
    return works


def main():
    works = find_works()
    print("works:", len(works))
    if not works:
        return
    DATA.mkdir(exist_ok=True)

    catalog_path = DATA / "beitie_catalog.json"
    details_path = DATA / "beitie_details.json"
    old_pages_path = DATA / "beitie_pages.json"

    old_catalog = read_json(catalog_path, [])
    old_by_id = {str(x.get("id", "")).zfill(3): x for x in old_catalog if x.get("id") is not None}
    old_pages = read_json(old_pages_path, {})
    details = read_json(details_path, {})

    new_catalog = []
    for wid in sorted(works.keys()):
        w = works[wid]
        old = old_by_id.get(wid, {})
        item = dict(old)
        item.update({
            "id": wid,
            "title": old.get("title") or w["title"],
            "cover": w["cover"],
            "active": True,
            "detail_url": f"detail.html?id={wid}",
            "status": old.get("status") or "封面入口",
            "creator": old.get("creator") or "欧阳通（楷书），李俨（撰文）",
            "script": old.get("script") or "楷书",
            "dynasty": old.get("dynasty") or "龙朔三年十月十日刻立（663）",
            "shelf_mark": old.get("shelf_mark") or "暂缺",
            "subtitle": old.get("subtitle") or "封面、逐页图像与释文已接入；其余说明暂以《道因法师碑》信息作占位。"
        })
        new_catalog.append(item)
    write_json(catalog_path, new_catalog)

    page_index = {"works": {}}
    for wid, w in works.items():
        pages = [dict(p) for p in w["pages"]]
        old_page_map = {}
        if isinstance(old_pages, dict) and wid in old_pages:
            for p in old_pages[wid]:
                old_page_map[int(p.get("page", 0))] = p
        elif wid == "001" and isinstance(old_pages, dict) and "001" in old_pages:
            for p in old_pages["001"]:
                old_page_map[int(p.get("page", 0))] = p
        for p in pages:
            old = old_page_map.get(int(p["page"]))
            if old:
                p["text_clean"] = old.get("text_clean", "")
                p["text_raw"] = old.get("text_raw", "")
                p["char_count"] = old.get("char_count", len(p["text_clean"]))
                p["has_char_boxes"] = old.get("has_char_boxes", False)
        title = next((x["title"] for x in new_catalog if x["id"] == wid), w["title"])
        page_index["works"][wid] = {"id": wid, "title": title, "cover": w["cover"], "pages": pages}
    write_json(DATA / "page_images_index.json", page_index)

    template = details.get("001") or {}
    new_details = {}
    for item in new_catalog:
        wid = item["id"]
        if wid == "001" and "001" in details:
            d = details["001"]
        else:
            d = copy.deepcopy(template)
            d["id"] = wid
            d["title"] = item["title"]
            d["cover"] = item["cover"]
            d["summary"] = f"《{item['title']}》已接入封面与逐页图像；说明文字暂以《道因法师碑》信息作占位，后续可逐件替换。"
            if isinstance(d.get("basic"), dict):
                d["basic"]["责任者"] = item["creator"]
                d["basic"]["书体"] = item["script"]
                d["basic"]["年代"] = item["dynasty"]
                d["basic"]["馆藏号"] = item["shelf_mark"]
        new_details[wid] = d
    write_json(details_path, new_details)

    print("updated data/beitie_catalog.json")
    print("updated data/page_images_index.json")
    print("updated data/beitie_details.json")


if __name__ == "__main__":
    main()
