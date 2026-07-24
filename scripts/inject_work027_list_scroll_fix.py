from pathlib import Path

path=Path('detail.html')
text=path.read_text(encoding='utf-8')
tag='<script defer src="js/work-027-list-scroll-fix.js?v=20260725_work027_scroll_v2"></script>'
if tag not in text:
    marker='<script defer src="js/damage_ai_reading.js?v=20260725_wei_five_scroll_v1"></script>'
    if marker not in text:
        raise SystemExit('找不到栏目三脚本标记')
    text=text.replace(marker, marker+'\n'+tag, 1)
path.write_text(text,encoding='utf-8')
