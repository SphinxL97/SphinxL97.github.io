from pathlib import Path

path = Path('scripts/_tmp_build_work036.py')
text = path.read_text(encoding='utf-8')

old = """if slot_count != 23:
    raise RuntimeError(f'Unexpected transcript slot count: {slot_count}')
if len(box_rows) != slot_count:
    raise RuntimeError(f'Model □ count {len(box_rows)} does not equal transcript slot count {slot_count}')
"""
new = """if slot_count != 23:
    raise RuntimeError(f'Unexpected transcript slot count: {slot_count}')
if len(box_rows) < slot_count:
    raise RuntimeError(f'Model □ count {len(box_rows)} is smaller than transcript slot count {slot_count}')

# The model preserves 31 damaged positions, while the approved user transcript compresses
# eight of them into neighbouring single slots. Bind the 23 approved slots explicitly by
# page/glyph context; keep the other eight model boxes available in Column I only.
SLOT_GLYPH_IDS = {
    1:'036_瘗鹤铭_p0007_c001',
    2:'036_瘗鹤铭_p0012_c001',
    3:'036_瘗鹤铭_p0015_c002',
    4:'036_瘗鹤铭_p0016_c001',
    5:'036_瘗鹤铭_p0021_c001',
    6:'036_瘗鹤铭_p0024_c001',
    7:'036_瘗鹤铭_p0026_c001',
    8:'036_瘗鹤铭_p0036_c002',
    9:'036_瘗鹤铭_p0037_c002',
    10:'036_瘗鹤铭_p0039_c001',
    11:'036_瘗鹤铭_p0041_c001',
    12:'036_瘗鹤铭_p0041_c002',
    13:'036_瘗鹤铭_p0047_c001',
    14:'036_瘗鹤铭_p0048_c002',
    15:'036_瘗鹤铭_p0050_c002',
    16:'036_瘗鹤铭_p0053_c002',
    17:'036_瘗鹤铭_p0057_c002',
    18:'036_瘗鹤铭_p0063_c001',
    19:'036_瘗鹤铭_p0066_c001',
    20:'036_瘗鹤铭_p0068_c001',
    21:'036_瘗鹤铭_p0068_c002',
    22:'036_瘗鹤铭_p0073_c001',
    23:'036_瘗鹤铭_p0074_c002',
}
row_by_glyph = {str(row.get('glyph_id')): row for row in box_rows}
missing_glyphs = [glyph for glyph in SLOT_GLYPH_IDS.values() if glyph not in row_by_glyph]
if missing_glyphs:
    raise RuntimeError(f'Approved slot glyphs missing from model: {missing_glyphs}')
slot_map = {slot: row_by_glyph[glyph] for slot, glyph in SLOT_GLYPH_IDS.items()}
mapped_glyph_ids = set(SLOT_GLYPH_IDS.values())
extra_box_rows = [row for row in box_rows if str(row.get('glyph_id')) not in mapped_glyph_ids]
if len(extra_box_rows) != 8:
    raise RuntimeError(f'Expected 8 model-only compressed boxes, got {len(extra_box_rows)}')
"""
if old not in text:
    raise RuntimeError('validation block not found')
text = text.replace(old, new, 1)

old = """# 4. Bind the 23 transcript slots to the 23 real model □ rows in reading order.
slot_map = {index + 1: row for index, row in enumerate(box_rows)}
"""
new = """# 4. Bind the 23 approved transcript slots to explicit real model □ rows.
"""
if old not in text:
    raise RuntimeError('slot map block not found')
text = text.replace(old, new, 1)

text = text.replace("'match_method': 'approved-slot-order-exact-count',", "'match_method': 'approved-explicit-context-mapping',", 1)

old = """    'model_box_rows': len(box_rows),
    'transcript_box_slots': slot_count,
    'case_count': len(cases),
"""
new = """    'model_box_rows': len(box_rows),
    'transcript_box_slots': slot_count,
    'mapped_model_box_rows': len(mapped_glyph_ids),
    'model_only_compressed_box_rows': len(extra_box_rows),
    'model_only_compressed_glyph_ids': [str(row['glyph_id']) for row in extra_box_rows],
    'case_count': len(cases),
"""
if old not in text:
    raise RuntimeError('report count block not found')
text = text.replace(old, new, 1)

old = """    'binding_rule': '审核稿确认后，先自动断言036模型中的□字框总数与两段用户底稿的23个方框完全相等，再按两者阅读顺序一一绑定；数量不相等时构建直接失败。',
"""
new = """    'binding_rule': '真实模型共31个□字框；审核稿的23个方框按页码、前后文和残片顺序显式绑定23个真实字框。另8个模型残框对应被用户底稿压缩或未设槽位的残字，只保留在栏目一逐页坐标中，不作为栏目三候选。',
"""
if old not in text:
    raise RuntimeError('binding rule not found')
text = text.replace(old, new, 1)

intro_marker = """work036 = re.sub(r'const INTRO="[^"]*";', 'const INTRO="本栏目整理13组《瘗鹤铭》水前本与附水后本残文校读，覆盖用户底稿全部23个方框。能够由历代录文确认时采用文献对校；底稿存在错序、粘连或方框不足时，按审核稿给出混合判断或AI暂拟，并在“AI分析依据”中逐项说明。栏目二保留用户确认原文，栏目三只使用真实模型坐标。";', work036, count=1)
"""
cleanup_patch = intro_marker + """work036 = work036.replace(
    'let cases=[],current=0,pageMap=new Map(),listScrollTop=0;',
    '''let cases=[],current=0,pageMap=new Map(),listScrollTop=0,basisObserver=null,basisCleanupScheduled=false;
  function isLegacyBasis(node){
    if(!(node instanceof Element))return false;
    if(node.matches(".damage-basis-block,.damage-basis-card,[data-damage-basis]"))return true;
    if(!node.classList.contains("damage-block"))return false;
    return String(node.querySelector(":scope > .damage-label")?.textContent||"").trim()===["恢","复","依","据"].join("");
  }
  function removeLegacyBasis(root=document){
    const targets=new Set();
    if(root instanceof Element&&isLegacyBasis(root))targets.add(root);
    root.querySelectorAll?.(".damage-basis-block,.damage-basis-card,[data-damage-basis]").forEach(node=>targets.add(node));
    root.querySelectorAll?.(".damage-block").forEach(node=>{if(isLegacyBasis(node))targets.add(node);});
    targets.forEach(node=>node.remove());
  }
  function observeLegacyBasis(root){
    if(!(root instanceof Element))return;
    if(basisObserver)basisObserver.disconnect();
    basisObserver=new MutationObserver(()=>{
      if(basisCleanupScheduled)return;
      basisCleanupScheduled=true;
      queueMicrotask(()=>{basisCleanupScheduled=false;removeLegacyBasis(root);});
    });
    basisObserver.observe(root,{childList:true,subtree:true});
  }''', 1)
work036 = work036.replace(
    'if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();',
    'if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();removeLegacyBasis(section);observeLegacyBasis(section);', 1)
"""
if intro_marker not in text:
    raise RuntimeError('work036 intro generation marker not found')
text = text.replace(intro_marker, cleanup_patch, 1)

# The browser-only diagnostic workflow is temporary; remove it from the final commit.
text += "\ndebug_workflow = ROOT / '.github/workflows/_tmp_debug_work036_browser.yml'\nif debug_workflow.exists():\n    debug_workflow.unlink()\n"

path.write_text(text, encoding='utf-8')
print({'mapped': 23, 'expected_model_only': 8, 'legacy_basis_cleanup': True})
