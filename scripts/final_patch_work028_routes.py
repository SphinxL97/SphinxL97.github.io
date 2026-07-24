from pathlib import Path

root=Path(__file__).resolve().parents[1]
router=root/'js/damage_ai_reading.js'
entry=root/'js/detail_info_patch.js'

text=router.read_text(encoding='utf-8')
old='"026":"麻姑山仙坛记","027":"旧拓魏志五种"}'
new='"026":"麻姑山仙坛记","027":"旧拓魏志五种","028":"晋唐小楷九种"}'
if old not in text and new not in text:
    raise SystemExit('找不到路由标题表末尾')
text=text.replace(old,new,1)
old_list='"024","025","026","027"]'
new_list='"024","025","026","027","028"]'
count=text.count(old_list)
if count not in {0,2}:
    raise SystemExit(f'旧通用补丁名单出现次数异常：{count}')
text=text.replace(old_list,new_list)
if text.count('"028":"晋唐小楷九种"')!=1:
    raise SystemExit('028标题表数量不正确')
if text.count('"027","028"]')<2:
    raise SystemExit('028未完整加入旧补丁隔离名单')
router.write_text(text,encoding='utf-8')

text=entry.read_text(encoding='utf-8')
text=text.replace('"027":"旧拓魏志五种","028":"晋唐小楷九种","028":"晋唐小楷九种"','"027":"旧拓魏志五种","028":"晋唐小楷九种"')
text=text.replace('"026","027","028","028"','"026","027","028"')
marker='if(workId==="027")document.documentElement.classList.add("work027-no-location-map");'
addition=marker+'\n  if(workId==="028")document.documentElement.classList.add("work028-no-location-map");'
if 'if(workId==="028")document.documentElement.classList.add("work028-no-location-map");' not in text:
    if marker not in text:
        raise SystemExit('找不到027地图初始隐藏标记')
    text=text.replace(marker,addition,1)
if text.count('"028":"晋唐小楷九种"')!=1:
    raise SystemExit('详情入口028名称重复')
if '"026","027","028","028"' in text:
    raise SystemExit('详情入口028强制路由重复')
entry.write_text(text,encoding='utf-8')
print({'router_title_028':1,'legacy_skip_lists':2,'detail_name_028':1,'map_hidden_early':True})
