from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "js/work-027.js"
ROUTER = ROOT / "js/damage_ai_reading.js"
ENTRY = ROOT / "js/detail_info_patch.js"
DETAIL = ROOT / "detail.html"
OLD = "20260724_wei_five_v4"
NEW = "20260725_wei_five_scroll_v1"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, got {count}")
    return text.replace(old, new, 1)


def main() -> None:
    work = WORK.read_text(encoding="utf-8")
    work = work.replace(OLD, NEW)

    old_state = "  let cases=[],current=0,expanded=false;"
    new_state = """  let cases=[],current=0,expanded=false;
  function syncDamageListToCurrent(section){
    const list=section?.querySelector(\".damage-list\"),active=list?.querySelector(\".damage-tab.active\");
    if(!list||!active)return;
    requestAnimationFrame(()=>{
      if(!list.isConnected||!active.isConnected)return;
      const max=Math.max(0,list.scrollHeight-list.clientHeight);
      const target=active.offsetTop-(list.clientHeight-active.offsetHeight)/2;
      list.scrollTop=Math.max(0,Math.min(max,target));
    });
  }"""
    work = replace_once(work, old_state, new_state, "insert scroll helper")

    old_hook = ';section.querySelectorAll("[data-case-index]").forEach'
    new_hook = ';syncDamageListToCurrent(section);section.querySelectorAll("[data-case-index]").forEach'
    work = replace_once(work, old_hook, new_hook, "insert post-render scroll hook")
    WORK.write_text(work, encoding="utf-8")

    router = ROUTER.read_text(encoding="utf-8").replace(OLD, NEW)
    ROUTER.write_text(router, encoding="utf-8")

    entry = ENTRY.read_text(encoding="utf-8").replace(OLD, NEW)
    ENTRY.write_text(entry, encoding="utf-8")

    detail = DETAIL.read_text(encoding="utf-8").replace(OLD, NEW)
    DETAIL.write_text(detail, encoding="utf-8")

    assert work.count("function syncDamageListToCurrent") == 1
    assert work.count("syncDamageListToCurrent(section);") == 1
    assert "active.offsetTop-(list.clientHeight-active.offsetHeight)/2" in work
    assert OLD not in work
    assert NEW in router and NEW in entry and NEW in detail
    print({"fixed": "027 damage list scroll", "cache": NEW})


if __name__ == "__main__":
    main()
