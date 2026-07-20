/* 005《虞恭公温彦博碑》案例数据复核补丁。
 * 1. 保留“利□所同”，不擅自校作“心之所同”。
 * 2. 恢复“麟閣□形”独立案例。
 * 3. 将用户指定的碑末完整句纳入栏目三。
 */
(function(){
  "use strict";
  if(window.__WORK_005_CASE_DATA_PATCH_V3__)return;
  window.__WORK_005_CASE_DATA_PATCH_V3__=true;

  const nativeFetch=window.fetch.bind(window);
  const CASE_RE=/data\/yugonggong_all_damage_cases\.json(?:\?|$)/;

  function cloneItem(item){return JSON.parse(JSON.stringify(item));}

  function revise(data){
    const items=(Array.isArray(data)?data:[]).map(cloneItem);

    const c29=items.find(item=>item.id==="29");
    if(c29){
      c29.id="29x";
      c29.category="残损碑文恢复";
      c29.title="利□所同";
      c29.original="利□所同，必擇善以利物；";
      c29.corrected="利□所同，必擇善以利物；";
      c29.basis="参考录文与当前释文不一致";
      c29.mode="unresolved";
      c29.confidence="暂无法判断";
      c29.source="部分参考录文作“心之所同”，但当前拓片释文明确记录为“利□所同”。仅凭异本录文，不能把现有的“利”擅自改成“心”，也不能据此确定方框内就是“之”。";
      c29.analysis=[
        "当前原始释文只有一个缺字，形式为“利□所同”。",
        "“心之所同”属于参考录文中的另一种文本形态，不能直接覆盖当前拓片转写。",
        "在进一步核对原拓字形或更可靠旧拓前，本例保留原字“利”和原缺字“□”。"
      ];
      c29.usage="栏目二和栏目三均保留“利□所同”；本例不再归为形近字纠错，也不提出“心”字校正。";
      delete c29.locationNote;
    }

    const c37=items.find(item=>item.id==="37");
    if(c37){
      c37.id="37x";
      c37.category="残损碑文恢复";
      c37.title="麟閣□形";
      c37.original="麟閣□形";
      c37.corrected="麟閣〔圖〕形";
      c37.basis="文献对校";
      c37.mode="documentary";
      c37.confidence="高";
      c37.source="相关辑录保存“麟阁图形”，且第34页现有逐字坐标完整保存“麟、阁、□、形”的连续位置。";
      c37.analysis=[
        "“麟阁图形”指功臣画像绘于麒麟阁。",
        "原释文中的唯一缺字位于“麟阁”与“形”之间，补作“图”后词义和句法完整。",
        "本例只处理现存拓片中的“麟閣□形”，后续文献续录另列一例说明。"
      ];
      c37.usage="栏目二继续保留“麟閣□形”；栏目三以〔图〕展示文献对校结果，并使用第34页真实缺字坐标。";
      delete c37.locationNote;
    }

    const c38=items.find(item=>item.id==="38");
    if(c38){
      c38.id="38x";
      c38.category="残损碑文恢复";
      c38.title="碑末续文与□天箕毕";
      c38.original="麟閣□形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，□天箕毕。懿范昭兹，德音洋溢。）。";
      c38.corrected="麟閣□形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，〔配〕天箕毕。懿范昭兹，德音洋溢。）。";
      c38.basis="文献续录＋AI语境暂拟";
      c38.mode="provisional";
      c38.confidence="低至中";
      c38.source="碑末后续文字依用户指定版本完整保留。“麟閣□形”中的缺字另见上一案例；“□天箕毕”仍未见可以完全确定原字的现存拓片字形。";
      c38.analysis=[
        "本例展示栏目二中的完整碑末句，不再截断为“麟阁图形，乌台腾实”。",
        "“配天”是碑铭中常见表达，与“维地河山”形成天地对应，因此暂拟〔配〕。",
        "第34页逐字坐标止于原释文的“鸟”字，后续续录没有现存网页字框，不能设置虚构红框。"
      ];
      c38.usage="栏目二保留“麟閣□形”和“□天箕毕”两个缺字；前者在上一案例单独定位，后者仅展示AI候选〔配〕。";
      c38.locationNote="本例的后半段属于文献续录，当前逐字坐标没有“□天箕毕”的拓片字形，因此不设置虚构红框；“麟閣□形”的真实红框请查看上一案例。";
    }

    return items;
  }

  window.fetch=async function(input,init){
    const url=typeof input==="string"?input:String(input?.url||"");
    const response=await nativeFetch(input,init);
    if(!response.ok||!CASE_RE.test(url))return response;
    try{
      const data=await response.clone().json();
      const headers=new Headers(response.headers);
      headers.set("content-type","application/json; charset=utf-8");
      return new Response(JSON.stringify(revise(data)),{
        status:response.status,
        statusText:response.statusText,
        headers
      });
    }catch(error){
      console.error("[work-005-case-data-patch-v3]",error);
      return response;
    }
  };
})();