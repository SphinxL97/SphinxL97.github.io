from pathlib import Path

OLD_VERSION = "20260726_yiheming_036_v1"
NEW_VERSION = "20260726_yiheming_036_v2_caption"


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    if old not in text:
        if new in text:
            return
        raise RuntimeError(f"{label}: target not found in {path}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


work = Path("js/work-036.js")
text = work.read_text(encoding="utf-8")
text = text.replace(f'const VERSION="{OLD_VERSION}";', f'const VERSION="{NEW_VERSION}";', 1)
old_css = '.work036-image-stage{position:relative;width:min(100%,560px);margin:auto}.work036-image-stage img,.work036-page-only img{width:100%;height:auto;display:block;border-radius:10px}'
new_css = '.damage-image-card{overflow:hidden!important}.work036-case-image{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;padding:0 14px 10px}.work036-image-stage{position:relative;flex:1 1 auto;min-height:0;width:100%;margin:auto;overflow:hidden}.work036-image-stage img{width:100%;height:100%;object-fit:contain;display:block;border-radius:10px}.work036-page-only img{width:100%;height:auto;display:block;border-radius:10px}'
if old_css not in text and new_css not in text:
    raise RuntimeError("work036 image-stage style target not found")
text = text.replace(old_css, new_css, 1)
old_caption = '.work036-case-image p,.work036-page-only p{margin:10px 0 0!important;text-indent:0!important;font-size:12px;color:#766657;text-align:center}'
new_caption = '.work036-case-image p,.work036-page-only p{flex:0 0 auto;margin:0!important;padding:4px 4px 2px!important;text-indent:0!important;font-size:12px;line-height:1.5!important;color:#766657;text-align:center;position:relative;top:-2px}'
if old_caption not in text and new_caption not in text:
    raise RuntimeError("work036 caption style target not found")
text = text.replace(old_caption, new_caption, 1)
work.write_text(text, encoding="utf-8")

router = Path("js/damage_ai_reading.js")
router_text = router.read_text(encoding="utf-8")
if OLD_VERSION not in router_text and NEW_VERSION not in router_text:
    raise RuntimeError("036 router cache tag not found")
router.write_text(router_text.replace(OLD_VERSION, NEW_VERSION), encoding="utf-8")

detail = Path("detail.html")
detail_text = detail.read_text(encoding="utf-8")
if OLD_VERSION not in detail_text and NEW_VERSION not in detail_text:
    raise RuntimeError("detail cache tag not found")
detail.write_text(detail_text.replace(OLD_VERSION, NEW_VERSION), encoding="utf-8")

print({"version": NEW_VERSION, "caption_fix": True})
