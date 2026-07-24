from pathlib import Path

root = Path(__file__).resolve().parents[1]

path = root / "js/damage_ai_reading.js"
text = path.read_text(encoding="utf-8")
old = '''  if(window.__DAMAGE_AI_READING_ROUTER_V64__)return;
  window.__DAMAGE_AI_READING_ROUTER_V63__=true;
  window.__DAMAGE_AI_READING_ROUTER_V62__=true;
  window.__DAMAGE_AI_READING_ROUTER_V61__=true;'''
new = '''  if(window.__DAMAGE_AI_READING_ROUTER_V64__)return;
  window.__DAMAGE_AI_READING_ROUTER_V64__=true;
  window.__DAMAGE_AI_READING_ROUTER_V63__=true;
  window.__DAMAGE_AI_READING_ROUTER_V62__=true;
  window.__DAMAGE_AI_READING_ROUTER_V61__=true;'''
if old not in text:
    raise RuntimeError("damage router guard block not found")
path.write_text(text.replace(old, new, 1), encoding="utf-8")

path = root / "js/detail_info_patch.js"
text = path.read_text(encoding="utf-8")
old = '''  if(window.__DETAIL_INFO_STABLE_ENTRY_V23__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V22__=true;'''
new = '''  if(window.__DETAIL_INFO_STABLE_ENTRY_V23__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V22__=true;'''
if old not in text:
    raise RuntimeError("detail entry guard block not found")
text = text.replace(old, new, 1)
text = text.replace('''    window.__DAMAGE_AI_READING_ROUTER_V63__=true;
    window.__DAMAGE_AI_READING_ROUTER_V62__=true;
    window.__DAMAGE_AI_READING_ROUTER_V63__=true;
    window.__DAMAGE_AI_READING_ROUTER_V64__=true;''', '''    window.__DAMAGE_AI_READING_ROUTER_V63__=true;
    window.__DAMAGE_AI_READING_ROUTER_V62__=true;
    window.__DAMAGE_AI_READING_ROUTER_V64__=true;''', 1)
path.write_text(text, encoding="utf-8")
