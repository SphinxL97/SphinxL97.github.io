from pathlib import Path
import re

OLD_VERSION = "20260726_wushici_035_v2"
NEW_VERSION = "20260726_wushici_035_v3"


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def require(text: str, needle: str, path: str) -> None:
    if needle not in text:
        raise RuntimeError(f"{path}: missing expected text: {needle}")


# 1. Remove the Qing-note reading card from the source template and align the
#    image caption with the established format used by works 001–003.
path = "js/work-035.js"
text = read(path)
require(text, OLD_VERSION, path)
require(text, "清代题记校读说明", path)
require(text, "真实模型字框", path)
require(text, "拓片原图（定位）", path)

text = text.replace(OLD_VERSION, NEW_VERSION)
text, count = re.subn(
    r"\n  const NOTES=\[\n.*?\n  \];",
    "",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("work-035.js: failed to remove NOTES data")

text, count = re.subn(
    r"\n  function noteHTML\(\)\{return .*?\}\n",
    "\n",
    text,
    count=1,
)
if count != 1:
    raise RuntimeError("work-035.js: failed to remove noteHTML")

text = text.replace(
    "${paragraphHTML(text)}${noteHTML()}",
    "${paragraphHTML(text)}",
)
text = text.replace(
    '<p>第${page}页 · 真实模型字框 ${esc(loc.glyph_id||"")}</p>',
    '<p class="damage-caption">《${TITLE}》第${page}页，对应问题字局部</p>',
)
text = text.replace("<h3>拓片原图（定位）</h3>", "<h3>拓片原图（局部）</h3>")

# Remove styles that belonged only to the deleted note card.
text, count = re.subn(
    r"\.work035-note-card\{.*?\.work035-note-row p,\.work035-note-foot\{[^}]*\}",
    "",
    text,
    count=1,
)
if count != 1:
    raise RuntimeError("work-035.js: failed to remove note-card CSS")

for forbidden in ("清代题记校读说明", "noteHTML", "const NOTES=", "真实模型字框", "work035-note-card"):
    if forbidden in text:
        raise RuntimeError(f"work-035.js: forbidden text remains: {forbidden}")
for required in (
    "《${TITLE}》第${page}页，对应问题字局部",
    "拓片原图（局部）",
    NEW_VERSION,
):
    require(text, required, path)
write(path, text)

# 2. Keep the coordinate loader but bump its cache tag.
path = "js/work-035-coordinate-adapter.js"
text = read(path)
require(text, OLD_VERSION, path)
write(path, text.replace(OLD_VERSION, NEW_VERSION))

# 3. Bump the shared router and the 035 route assets.
path = "js/damage_ai_reading.js"
text = read(path)
require(text, "__DAMAGE_AI_READING_ROUTER_V77__", path)
require(text, OLD_VERSION, path)
text = text.replace(
    'if(window.__DAMAGE_AI_READING_ROUTER_V77__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V77__=true;',
    'if(window.__DAMAGE_AI_READING_ROUTER_V78__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V78__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V77__=true;',
    1,
)
text = text.replace(OLD_VERSION, NEW_VERSION)
write(path, text)

# 4. Bump the stable detail entry and recovery version.
path = "js/detail_info_patch.js"
text = read(path)
require(text, "__DETAIL_INFO_STABLE_ENTRY_V37__", path)
require(text, OLD_VERSION, path)
text = text.replace(
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V37__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V37__=true;',
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V38__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V38__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V37__=true;',
    1,
)
text = text.replace(OLD_VERSION, NEW_VERSION)
write(path, text)

# 5. Bust the top-level HTML cache references.
path = "detail.html"
text = read(path)
require(text, OLD_VERSION, path)
write(path, text.replace(OLD_VERSION, NEW_VERSION))

print("work035 note/caption patch prepared")
