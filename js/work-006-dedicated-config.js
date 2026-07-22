(function(){"use strict";if(window.__WORK_006_DEDICATED_CONFIG__)return;window.__WORK_006_DEDICATED_CONFIG__=true;
window.WORK_DEDICATED_CONFIG={
 workId:"006",
 title:"史晨后碑",
 textUrl:"data/shichenhou_full_text.txt?v=20260722_shichenhou_final_v1",
 caseUrl:"data/shichenhou_damage_cases.json?v=20260722_shichenhou_final_v1",
 modelUrl:"data/model_boxes/glyph_model_border_006_010.json?v=20260721_shichenhou_firstbox_v1",
 pageIndexUrl:"data/page_images_index.json?v=20260721_shichenhou_firstbox_v1",
 intro:"本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字提出校读意见。AI分析重点说明候选字的词义、句法、礼制用语、人名官名及上下文关系；不能与现有方框逐字对应的外部录文不直接写入恢复结果。",
 prepare(rows){
  return (Array.isArray(rows)?rows:[]).map((row,index)=>{
   const id=String(row.id||index+1).padStart(2,"0");
   const category=String(row.category||row.n||"残损碑文恢复");
   const title=String(row.title||row.t||`第${id}处缺字`);
   const original=String(row.original||row.o||"");
   const corrected=String(row.corrected||row.c||original);
   return {
    id,n:category,t:title,o:original,c:corrected,
    page:row.page||"—",
    category,title,original,corrected,
    mode:String(row.mode||"unresolved"),
    confidence:String(row.confidence||"暂无法判断"),
    analysis:Array.isArray(row.analysis)?row.analysis.map(String):[],
    locations:Array.isArray(row.locations)?row.locations:[]
   };
  });
 }
};
})();