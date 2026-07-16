/*
 * 碑帖详情页统一入口。
 * 先原样加载既有详情补丁，再仅覆盖顶部信息卡的数据与呈现。
 * 收藏历史、背景故事、字框、释文与众智释读等功能仍由原补丁负责。
 */
(function loadExistingDetailPatch(){
  "use strict";
  const coreUrl="js/detail_info_patch_core.js?v=20260716_header_v1";

  function startHeaderCardPatch(){
    (function installCompleteHeaderCards(){
      "use strict";
      if(window.__COMPLETE_BEITIE_HEADER_CARDS__) return;
      window.__COMPLETE_BEITIE_HEADER_CARDS__=true;

      const rawId=String(new URLSearchParams(location.search).get("id")||"001");
      const workId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
      const dataUrl="data/beitie_header_info.json?v=20260716_complete_v1";
      let headerData=null;
      let applyTimer=0;

      function clean(value){
        return String(value==null?"":value).trim();
      }

      function first(...values){
        for(const value of values){
          const text=clean(value);
          if(text) return text;
        }
        return "";
      }

      function currentTitle(){
        return clean(document.querySelector(".info-panel h1")?.textContent);
      }

      function buildRows(record){
        const b=(record&&record.basic)||{};
        const rows=[];
        const push=(label,value,wide=false)=>{
          const text=clean(value);
          if(text) rows.push({label,value:text,wide});
        };

        const firstTitle=first(b["首题"]);
        if(firstTitle&&firstTitle!==currentTitle()) push("首题",firstTitle,firstTitle.length>24);
        push("其他题名",b["其他题名"],true);
        push("额题",b["额题"]);
        push("责任者",b["责任者"]);
        push("书体",b["书体"]);
        push("版本",b["版本"]);
        push("影印版本",b["影印版本"]);
        push("版本说明",b["版本说明"],true);
        push("数量",b["数量"]);
        push("尺寸",b["尺寸"],true);
        push("年代",first(b["刻立年代"],b["年代"],b["时代"]));
        push("刻立地点",first(b["刻立地点"],b["地点"]));
        push("出土地点",b["出土地点"]);
        push("馆藏",b["馆藏"]);
        push("镌刻特征",b["镌刻特征"],true);
        push("铭文行款",b["铭文行款"],true);
        push("来源",b["来源"],true);
        return rows;
      }

      function render(record){
        const box=document.querySelector(".info-panel .meta-lines");
        if(!box||!record) return;
        const rows=buildRows(record);
        const fragment=document.createDocumentFragment();

        rows.forEach(item=>{
          const line=document.createElement("div");
          line.className="meta-line";
          if(item.wide||item.value.length>38) line.classList.add("wide");

          const term=document.createElement("b");
          term.textContent=item.label;
          const value=document.createElement("span");
          value.textContent=item.value;

          line.append(term,value);
          fragment.appendChild(line);
        });

        box.replaceChildren(fragment);
        box.dataset.completeHeaderWork=workId;
      }

      function applyRepeatedly(record){
        render(record);
        let count=0;
        clearInterval(applyTimer);
        applyTimer=window.setInterval(()=>{
          render(record);
          count+=1;
          if(count>=24) clearInterval(applyTimer);
        },300);
        window.addEventListener("load",()=>render(record),{once:true});
      }

      async function load(){
        try{
          const response=await fetch(dataUrl,{cache:"no-store"});
          if(!response.ok) throw new Error(`${dataUrl} ${response.status}`);
          headerData=await response.json();
          const record=headerData&&headerData[workId];
          if(!record) return;
          applyRepeatedly(record);
        }catch(error){
          console.error("[header-card] 完整信息卡加载失败",error);
        }
      }

      if(document.readyState==="loading"){
        document.addEventListener("DOMContentLoaded",load,{once:true});
      }else{
        load();
      }
    })();
  }

  try{
    const request=new XMLHttpRequest();
    request.open("GET",coreUrl,false);
    request.send(null);
    if((request.status>=200&&request.status<300)||request.status===0){
      (0,eval)(`${request.responseText}\n//# sourceURL=${coreUrl}`);
      startHeaderCardPatch();
      return;
    }
    throw new Error(`${coreUrl} ${request.status}`);
  }catch(error){
    console.warn("[detail-patch] 同步加载原补丁失败，改用脚本回退",error);
    const script=document.createElement("script");
    script.src=coreUrl;
    script.async=false;
    script.addEventListener("load",startHeaderCardPatch,{once:true});
    script.addEventListener("error",()=>{
      console.error("[detail-patch] 原补丁加载失败",coreUrl);
      startHeaderCardPatch();
    },{once:true});
    document.head.appendChild(script);
  }
})();
