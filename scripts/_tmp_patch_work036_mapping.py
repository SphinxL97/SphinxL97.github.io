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

path.write_text(text, encoding='utf-8')
print({'mapped': 23, 'expected_model_only': 8})
